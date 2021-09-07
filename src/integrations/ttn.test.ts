import buildServer from "../lib/server";

import {
  authtokenEndpoint,
  betterDeleteUser,
  createAuthToken,
  createDevice,
  createProject,
  jwtSecret,
  signupUser,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "../__test-utils";

const issuer = "tsb";
const buildServerOpts = {
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger: false,
  issuer,
};

const ttnPayload = {
  end_device_ids: {
    device_id: "123",
  },
  received_at: new Date().toISOString(),
  uplink_message: {
    decoded_payload: { measurements: [1, 2, 3] },
    locations: { user: { latitude: 13, longitude: 52, altitude: 23 } },
  },
};
describe("tests for the ttn integration", () => {
  test("should be rejected due to no GET route", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "GET",
      url: "/api/v2/integrations/ttn/v3",
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"message\\":\\"Route GET:/api/v2/integrations/ttn/v3 not found\\",\\"error\\":\\"Not Found\\",\\"statusCode\\":404}"`
    );
  });
  test("should be rejected due to no body", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/integrations/ttn/v3",
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
      url: "/api/v2/integrations/ttn/v3",
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"body should have required property 'end_device_ids'\\"}"`
    );
  });
  test("should be rejected due to no token", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/integrations/ttn/v3",
      payload: ttnPayload,
    });
    expect(response.statusCode).toBe(401);
  });
  test("should find no device", async () => {
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
    // end boilerplate

    const response = await server.inject({
      method: "POST",
      url: "/api/v2/integrations/ttn/v3",
      payload: ttnPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"device not found\\"}"`
    );
    // end boilerplate teardown test
    await betterDeleteUser(user.token);
  });
  test("should find no authtoken", async () => {
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
    const url = authtokenEndpoint;

    const getResponse = await server.inject({
      method: "GET",
      url: `${url}?projectId=${project.id}`,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
    });

    const parsedGetRes = JSON.parse(getResponse.body);

    await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: project.id,
        tokenId: parsedGetRes.data[0].niceId,
      },
    });
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/integrations/ttn/v3",
      payload: ttnPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":401,\\"error\\":\\"Unauthorized\\",\\"message\\":\\"Unauthorized\\"}"`
    );
    // end boilerplate teardown test
    await betterDeleteUser(user.token);
  });

  test("should pass", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const project = await createProject({
      userId: user.id,
    });
    await createDevice({
      userId: user.id,
      projectId: project.id,
      externalId: ttnPayload.end_device_ids.device_id,
    });
    const authToken = await createAuthToken({
      server,
      userToken: user.token,
      projectId: project.id,
    });
    // end boilerplate
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/integrations/ttn/v3",
      payload: ttnPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(201);
    // end boilerplate teardown test
    await betterDeleteUser(user.token);
  });
});
