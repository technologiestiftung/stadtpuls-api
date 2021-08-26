/* eslint-disable jest/no-hooks */
import buildServer from "./server";
import faker from "faker";
import { createClient } from "@supabase/supabase-js";

import { verify } from "jsonwebtoken";
const supabaseUrl = "http://localhost:8000";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "123";
const jwtSecret =
  process.env.JWT_SECRET ||
  "super-secret-jwt-token-with-at-least-32-characters-long";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "123";
const apikey = supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
let userToken: string;
let userId: string;
const email = faker.internet.email();
const password = faker.internet.password();
import { deleteUser, JWTPayload, login, signup } from "../__test-utils";
import { definitions } from "../common/supabase";
const issuer = "tsb";
describe("server tests", () => {
  beforeAll(async () => {
    const { id, token } = await signup({
      anonKey: supabaseAnonKey,
      email,
      password,
      url: new URL(`${supabaseUrl}/auth/v1/signup`),
    });
    userId = id;
    userToken = token;
  });

  afterAll(async () => {
    const { id, token } = await login({
      anonKey: supabaseAnonKey,
      email,
      password,
      url: new URL(`${supabaseUrl}/auth/v1/token?grant_type=password`),
    });
    userId = id;
    userToken = token;
    const success = await deleteUser({
      anonKey: supabaseAnonKey,
      userToken,
      url: new URL(`${supabaseUrl}/rest/v1/rpc/delete_user`),
    });
    if (!success) {
      throw new Error("could not delete user");
    }
  });

  test("should run the server and inject routes", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });

    const response = await server.inject({ method: "GET", url: "/api/v2" });
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"comment\\":\\"healthcheck\\",\\"method\\":\\"GET\\",\\"url\\":\\"/api/v2\\"}"`
    );
  });

  test("should complain on GET with 400 due to bad querystring", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });

    const response = await server.inject({
      method: "GET",
      url: "/api/v2/authtokens",
      headers: { apikey },
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"querystring should have required property 'projectId'\\"}"`
    );
  });

  test("should GET an empty list of tokens for that user", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });
    const { data: project, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!project) {
      throw error;
    }

    const url = `/api/v2/authtokens?projectId=${project[0].id}`;
    const response = await server.inject({
      method: "GET",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
    });
    // console.log(response);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchSnapshot({
      comment: expect.any(String),
      url: expect.any(String),
    });
  });
  test("should create a new token for that users project", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });

    const { data: projects, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!projects) {
      throw error;
    }
    if (projects.length === 0) {
      throw new Error("could not create project");
    }

    const url = `/api/v2/authtokens`;
    const response = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: projects[0].id,
        description: "testing",
      },
    });
    // console.log(response);
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toMatchSnapshot({
      comment: expect.any(String),
      data: { token: expect.any(String) },
    });
  });

  test("should get a list of tokens that match the created one for that users project", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });

    const { data: projects, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!projects) {
      throw error;
    }
    if (projects.length === 0) {
      throw new Error("could not create project");
    }

    const url = `/api/v2/authtokens`;
    const response = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: projects[0].id,
        description: "testing",
      },
    });
    const getResponse = await server.inject({
      method: "GET",
      url: `${url}?projectId=${projects[0].id}`,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
    });

    const postResBody = JSON.parse(response.body);
    const getResBody = JSON.parse(getResponse.body);
    const decodedToken = verify(
      postResBody.data.token,
      jwtSecret
    ) as JWTPayload;
    expect(
      getResBody.data.every(
        (item: { projectId: number; description: string; niceId: number }) =>
          item.projectId === projects[0].id
      )
    ).toBeTruthy();
    expect(userId).toBe(decodedToken.sub);
    expect(projects[0].id).toBe(decodedToken.projectId);
    expect(decodedToken.iss).toBe(issuer);
    expect(response.statusCode).toBe(201);
    expect(getResponse.statusCode).toBe(200);
  });

  test("should only have one token for the project", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });

    const { data: projects, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!projects) {
      throw error;
    }
    if (projects.length === 0) {
      throw new Error("could not create project");
    }

    const url = `/api/v2/authtokens`;
    const postResponse1 = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: projects[0].id,
        description: "testing",
      },
    });
    const postResponse2 = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: projects[0].id,
        description: "testing1",
      },
    });
    const getResponse = await server.inject({
      method: "GET",
      url: `${url}?projectId=${projects[0].id}`,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
    });

    const postResBody1 = JSON.parse(postResponse1.body);
    verify(postResBody1.data.token, jwtSecret) as JWTPayload;

    const postResBody2 = JSON.parse(postResponse2.body);
    const decodedToken2 = verify(
      postResBody2.data.token,
      jwtSecret
    ) as JWTPayload;

    const getResBody = JSON.parse(getResponse.body);
    expect(getResBody.data[0].projectId).toBe(decodedToken2.projectId);
    expect(getResBody.data[0].description).toBe(decodedToken2.description);
    expect(getResBody.data).toHaveLength(1);
  });

  test("should delete a token by its id", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });

    const { data: projects, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!projects) {
      throw error;
    }
    if (projects.length === 0) {
      throw new Error("could not create project");
    }

    const url = `/api/v2/authtokens`;
    await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: projects[0].id,
        description: "testing",
      },
    });
    const getResponse = await server.inject({
      method: "GET",
      url: `${url}?projectId=${projects[0].id}`,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
    });

    const parsedGetRes = JSON.parse(getResponse.body);
    const deleteResponse = await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: projects[0].id,
        tokenId: parsedGetRes.data[0].niceId,
      },
    });
    const anothergetResponse = await server.inject({
      method: "GET",
      url: `${url}?projectId=${projects[0].id}`,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
    });
    const anotherParsedGetResponse = JSON.parse(anothergetResponse.body);
    expect(anotherParsedGetResponse.data).toHaveLength(0);
    expect(deleteResponse.statusCode).toBe(204);
  });

  test("should not find a project", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });
    const url = `/api/v2/authtokens`;
    const response = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: 9999999,
        description: "testing",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"project not found\\"}"`
    );
  });

  test("should not find the token", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });

    const { data: projects, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!projects) {
      throw error;
    }
    if (projects.length === 0) {
      throw new Error("could not create project");
    }
    const url = `/api/v2/authtokens`;
    const response = await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: projects[0].id,
        tokenId: 99999,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"token not found\\"}"`
    );
  });

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip("should get a internal server error", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey: "123",
      logger: false,
      issuer: "tsb",
    });
    const url = `/api/v2/authtokens`;
    const response = await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: 123,
        tokenId: 99999,
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":500,\\"error\\":\\"Internal Server Error\\",\\"message\\":\\"Internal Server Error\\"}"`
    );
  });
});
