/* eslint-disable jest/no-hooks */
import buildServer from "./server";
import { verify } from "jsonwebtoken";
import {
  JWTPayload,
  deleteUser,
  supabaseUrl,
  supabaseServiceRoleKey,
  jwtSecret,
  supabaseAnonKey,
  signupUser,
  createAuthToken,
  apiVersion,
} from "../__test-utils";

const apikey = supabaseAnonKey;

const buildServerOpts = {
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger: false,
  issuer: "tsb",
};
describe("server tests", () => {
  test("should run the server and inject routes", async () => {
    const server = buildServer(buildServerOpts);

    const response = await server.inject({
      method: "GET",
      url: `/api/v${apiVersion}`,
    });
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"comment\\":\\"healthcheck\\",\\"method\\":\\"GET\\",\\"url\\":\\"/api/v3\\"}"`
    );
  });

  test("should complain on GET with 401 due to missing token", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "GET",
      url: `/api/v${apiVersion}/authtokens`,
      headers: { apikey: supabaseAnonKey },
    });
    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":401,\\"error\\":\\"Unauthorized\\",\\"message\\":\\"No Authorization was found in request.headers\\"}"`
    );
  });

  test("should GET an empty list of tokens for that user", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const response = await server.inject({
      method: "GET",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
    });
    // console.log(response);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchSnapshot({
      url: expect.any(String),
    });
    await deleteUser(user.token);
  });
  test("should create a new token for that users", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const response = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        description: "testing",
      },
    });
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toMatchSnapshot({
      data: { token: expect.any(String) },
    });
    await deleteUser(user.token);
  });

  test("should get a list of tokens that match the created one for that users", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const response = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        description: "testing",
      },
    });
    const getResponse = await server.inject({
      method: "GET",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
    });

    const postResBody = JSON.parse(response.body);
    // const getResBody = JSON.parse(getResponse.body);
    const decodedToken = verify(
      postResBody.data.token,
      jwtSecret
    ) as JWTPayload;
    // expect(
    //   getResBody.data.every(
    //     (item: { projectId: number; description: string; niceId: number }) =>
    //       item.projectId === project.id
    //   )
    // ).toBeTruthy();
    expect(user.id).toBe(decodedToken.sub);
    expect(decodedToken.iss).toBe(buildServerOpts.issuer);
    expect(response.statusCode).toBe(201);
    expect(getResponse.statusCode).toBe(200);

    // boilerplate teardown
    await deleteUser(user.token);
  });

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip("should only have one token for the user", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const postResponse1 = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        description: "testing",
      },
    });
    const postResponse2 = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        description: "testing1",
      },
    });
    const getResponse = await server.inject({
      method: "GET",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
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
    expect(getResBody.data[0].description).toBe(decodedToken2.description);
    expect(getResBody.data).toHaveLength(1);
    await deleteUser(user.token);
  });

  test("should delete a token by its id", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    await createAuthToken({
      server,
      userToken: user.token,
    });

    const url = `/api/v${apiVersion}/authtokens`;

    const getResponse = await server.inject({
      method: "GET",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
    });

    const parsedGetRes = JSON.parse(getResponse.body);
    const deleteResponse = await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        nice_id: parsedGetRes.data[0].nice_id,
      },
    });
    const anothergetResponse = await server.inject({
      method: "GET",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
    });
    const anotherParsedGetResponse = JSON.parse(anothergetResponse.body);
    expect(anotherParsedGetResponse.data).toHaveLength(0);
    expect(deleteResponse.statusCode).toBe(204);
    await deleteUser(user.token);
  });

  test("should not find the token", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const response = await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        nice_id: 99999,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"token not found\\"}"`
    );
    await deleteUser(user.token);
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
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const response = await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        nice_id: 99999,
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":500,\\"error\\":\\"Internal Server Error\\",\\"message\\":\\"Internal Server Error\\"}"`
    );
    await deleteUser(user.token);
  });
});
