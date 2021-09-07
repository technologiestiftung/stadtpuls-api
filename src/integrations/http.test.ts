import buildServer from "../lib/server";

import {
  betterDeleteUser,
  createProject,
  createAuthToken,
  signupUser,
  createDevice,
  jwtSecret,
  supabaseServiceRoleKey,
  supabaseAnonKey,
  supabaseUrl,
  authtokenEndpoint,
} from "../__test-utils";

const issuer = "tsb";
const buildServerOpts = {
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger: false,
  issuer,
};

const httpPayload = {
  latitude: 52.483107,
  longitude: 13.390679,
  altitude: 30,
  measurements: [1, 2, 3],
};
describe("tests for the http integration", () => {
  test("should be rejected due to no GET route", async () => {
    const server = buildServer(buildServerOpts);
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
    const server = buildServer(buildServerOpts);
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
    const server = buildServer(buildServerOpts);
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
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/devices/1/records",
      payload: httpPayload,
    });
    expect(response.statusCode).toBe(401);
  });

  test("should find no device", async () => {
    // start boilerplate
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const project = await createProject({
      userId: user.id,
    });
    const authToken = await createAuthToken({
      server,
      userToken: user.token,
      projectId: project.id,
    });
    // end boilerplate
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/devices/1/records",
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"device not found\\"}"`
    );
    // start boilerplate
    await betterDeleteUser(user.token);
    // end boilerplate
  });

  test("should find no authtoken", async () => {
    // start boilerplate1
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const project = await createProject({
      userId: user.id,
    });
    const authToken = await createAuthToken({
      server,
      userToken: user.token,
      projectId: project.id,
    });
    // end boilerplate
    // this test:
    // 1. creates a server
    // 2. creates a user
    // 3. creates a project
    // 4. creates an auth token
    // 5. deletes the auth token
    // 6. tries to create a record
    // 7. checks should be rejected
    // maybe this should be a separate test suite?
    const url = authtokenEndpoint;

    const getResponse = await server.inject({
      method: "GET",
      url: `${url}?projectId=${project.id}`,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
    });

    const response1 = JSON.parse(getResponse.body);

    await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: project.id,
        tokenId: response1.data[0].niceId,
      },
    });
    const response2 = await server.inject({
      method: "POST",
      url: "/api/v2/devices/1/records",
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response2.statusCode).toBe(401);
    expect(response2.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":401,\\"error\\":\\"Unauthorized\\",\\"message\\":\\"Unauthorized\\"}"`
    );
    // start boilerplate
    await betterDeleteUser(user.token);
    // end boilerplate
  });

  test("should fail due to deviceId param is not a number", async () => {
    // start boilerplate
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const project = await createProject({
      userId: user.id,
    });
    const authToken = await createAuthToken({
      server,
      userToken: user.token,
      projectId: project.id,
    });

    // end boilerplate

    const response = await server.inject({
      method: "POST",
      url: `/api/v2/devices/abc/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(400);
    // start boilerplate
    await betterDeleteUser(user.token);
    // end boilerplate
  });
  test("should pass", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const project = await createProject({
      userId: user.id,
    });
    const authToken = await createAuthToken({
      server,
      userToken: user.token,
      projectId: project.id,
    });
    const device = await createDevice({
      userId: user.id,
      projectId: project.id,
    });
    // end boilerplate

    const response = await server.inject({
      method: "POST",
      url: `/api/v2/devices/${device.id}/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(201);
    // start boilerplate delete user
    await betterDeleteUser(user.token);
    // end boilerplate
  });
  // test should throw an PostgrestError
  // how can we mock the call to supabase.from("authtokens")
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip("should throw an internal server error 500", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const project = await createProject({
      userId: user.id,
    });
    const authToken = await createAuthToken({
      server,
      userToken: user.token,
      projectId: project.id,
    });
    const device = await createDevice({
      userId: user.id,
      projectId: project.id,
    });

    const response = await server.inject({
      method: "POST",
      url: `/api/v2/devices/${device.id}/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(500);
    // start boilerplate delete user
    await betterDeleteUser(user.token);
    // end boilerplate
  });
});
