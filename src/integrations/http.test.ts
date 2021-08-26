/* eslint-disable jest/no-hooks */
import buildServer from "../lib/server";
import faker from "faker";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://localhost:8000";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "123";
const jwtSecret =
  process.env.JWT_SECRET ||
  "super-secret-jwt-token-with-at-least-32-characters-long";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "123";
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
let userToken: string;
let userId: string;
const email = faker.internet.email();
const password = faker.internet.password();
import { deleteUser, login, signup } from "../__test-utils";
import { definitions } from "../common/supabase";
const issuer = "tsb";

const httpPayload = {
  latitude: 52.483107,
  longitude: 13.390679,
  altitude: 30,
  measurements: [1, 2, 3],
};
describe("tests for the http integration", () => {
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

  test("should be rejected due to no GET route", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const response = await server.inject({
      method: "GET",
      url: "/api/v2/devices/1/records",
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"message\\":\\"Route GET:/api/v2/devices/1/records not found\\",\\"error\\":\\"Not Found\\",\\"statusCode\\":404}"`
    );
  });

  test("should be rejected due to no POST body", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/devices/1/records",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"body should be object\\"}"`
    );
  });

  test("should be rejected due to no wrong body", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/devices/1/records",
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"body should have required property 'measurements'\\"}"`
    );
  });

  test("should be rejected due to no token", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/devices/1/records",
      payload: httpPayload,
    });
    expect(response.statusCode).toBe(401);
  });

  test("should find no device", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const { data: projects, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!projects) {
      throw error;
    }

    const url = `/api/v2/authtokens`;
    const responseToken = await server.inject({
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

    const resBody = JSON.parse(responseToken.body);
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/devices/1/records",
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${resBody.data.token}`,
      },
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"device not found\\"}"`
    );
  });

  test("should find no authtoken", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const { data: projects, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!projects) {
      throw error;
    }

    const url = `/api/v2/authtokens`;
    const responseToken = await server.inject({
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

    const resBody = JSON.parse(responseToken.body);
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
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/devices/1/records",
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${resBody.data.token}`,
      },
    });
    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":401,\\"error\\":\\"Unauthorized\\",\\"message\\":\\"Unauthorized\\"}"`
    );
  });

  test("should pass", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const { data: projects, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!projects) {
      throw error;
    }

    const { data: devices, error: dError } = await supabase
      .from<definitions["devices"]>("devices")
      .insert([
        {
          name: "test",
          userId,
          projectId: projects[0].id,
          // externalId: httpPayload.end_device_ids.device_id,
        },
      ]);
    if (!devices) {
      throw dError;
    }

    const url = `/api/v2/authtokens`;
    const responseToken = await server.inject({
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

    const resBody = JSON.parse(responseToken.body);
    const response = await server.inject({
      method: "POST",
      url: `/api/v2/devices/${devices[0].id}/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${resBody.data.token}`,
      },
    });
    expect(response.statusCode).toBe(201);
  });
});
