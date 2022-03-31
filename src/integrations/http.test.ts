/* eslint-disable jest/no-hooks */
import buildServer from "../lib/server";

import {
  deleteUser,
  jwtSecret,
  supabaseServiceRoleKey,
  supabaseAnonKey,
  supabaseUrl,
  authtokenEndpoint,
  apiVersion,
  Sensor,
  signupUser,
  createSensor,
  truncateTables,
  closePool,
  connectPool,
} from "../__test-utils";
import { createAuthToken } from "../__test-utils/create-auth-token";

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
  // eslint-disable-next-line jest/no-hooks
  beforeAll(async () => {
    await connectPool();
  });
  beforeEach(async () => {
    await truncateTables();
  });
  // eslint-disable-next-line jest/no-hooks
  afterAll(async () => {
    await truncateTables();
    await closePool();
  });
  test("should be rejected due to no GET route", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "GET",
      url: `/api/v${apiVersion}/sensors/1/records`,
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"Not Found\\"}"`
    );
  });

  test("should be rejected due to no POST body", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    await createSensor({ user_id: user.id });
    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/1/records`,
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"body should be object\\"}"`
    );
    await deleteUser(user.token);
  });

  test("should be rejected due to no wrong body", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const sensor = await createSensor({
      user_id: user.id,
    });
    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      payload: {},
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"body should have required property 'measurements'\\"}"`
    );
    // start boilerplate
    await deleteUser(user.token);
    // end boilerplate
  });

  test("should be rejected due to no authorization header", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/1/records`,
      payload: httpPayload,
    });
    expect(response.statusCode).toBe(400);
  });

  test("should find no sensor", async () => {
    // start boilerplate
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    // end boilerplate
    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/1/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"sensor not found\\"}"`
    );
    // start boilerplate
    await deleteUser(user.token);
    // end boilerplate
  });

  test("should find no authtoken", async () => {
    // start boilerplate1
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
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
      url: `${url}`,
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
        nice_id: response1.data[0].nice_id,
      },
    });
    const response2 = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/1/records`,
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
    await deleteUser(user.token);
    // end boilerplate
  });

  test("should fail due to sensorId param is not a number", async () => {
    // start boilerplate
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });

    // end boilerplate

    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/abc/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(400);
    // start boilerplate
    await deleteUser(user.token);
    // end boilerplate
  });
  test("should pass", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const device = await createSensor({
      user_id: user.id,
    });
    // end boilerplate

    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${device.id}/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(201);
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });

  test("should pass with additional properties", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const device = await createSensor({
      user_id: user.id,
    });
    // end boilerplate

    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${device.id}/records`,
      payload: {
        additionalProperties: { something: "unexpected" },
        ...httpPayload,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(201);
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });

  test("should set recorded_at of record", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const device = await createSensor({
      user_id: user.id,
    });
    // end boilerplate
    const recorded_at = "2020-01-01T00:00:00.000Z";
    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${device.id}/records`,
      payload: {
        ...httpPayload,
        recorded_at,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().record[0].recorded_at).toBe(
      "2020-01-01T00:00:00+00:00"
    );
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });

  test.only("should reject recorded_at if date-time cannot be parsed as date", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const device = await createSensor({
      user_id: user.id,
    });
    // end boilerplate
    const recorded_at = "abc";
    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${device.id}/records`,
      payload: {
        ...httpPayload,
        recorded_at,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Bad Request",
        "message": "recorded_at should match format 'date-time' in ISO 8601 notation with UTC offset. Should be YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss+HH:mm or YYYY-MM-DDTHH:mm:ss-HH:mm-HH:mm",
        "statusCode": 400,
      }
    `);
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });
  test("should set recorded_at of record with timezone done right", async () => {
    // see https://en.wikipedia.org/wiki/ISO_8601
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const device = await createSensor({
      user_id: user.id,
    });
    // end boilerplate
    const recorded_at = "2020-01-02T06:00:00-06:00";
    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${device.id}/records`,
      payload: {
        ...httpPayload,
        recorded_at: recorded_at,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().record[0].recorded_at).toBe(
      "2020-01-02T12:00:00+00:00"
    );
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });

  // test should throw an PostgrestError
  // how can we mock the call to supabase.from("authtokens")
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip("should throw an internal server error 500", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const device = await createSensor({
      user_id: user.id,
    });

    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${device.id}/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(500);
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });

  test("should change the lat/lon/alt of a sensor via payload of record", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const authToken = await createAuthToken({ server, userToken: user.token });
    const sensor = await createSensor({
      user_id: user.id,
    });
    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const {
      data: verifySensor,
      error: _error,
    } = await server.supabase
      .from<Sensor>("sensors")
      .select("*")
      .eq("id", sensor.id)
      .single();
    expect(verifySensor).not.toBeNull();
    expect(response.statusCode).toBe(201);
    expect((verifySensor as Sensor).latitude).toBe(httpPayload.latitude);
    expect((verifySensor as Sensor).longitude).toBe(httpPayload.longitude);
    expect((verifySensor as Sensor).altitude).toBe(httpPayload.altitude);
    await deleteUser(user.token);
  });
});
