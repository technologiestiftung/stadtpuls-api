/* eslint-disable jest/no-hooks */
import buildServer from "../lib/server";

import {
  authtokenEndpoint,
  deleteUser,
  jwtSecret,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
  apiVersion,
  Sensor,
  signupUser,
  createTTNPayload,
  createAuthToken,
  createSensor,
  truncateTables,
  closePool,
  connectPool,
} from "../__test-utils";

const issuer = "tsb";
const buildServerOpts = {
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger: false,
  issuer,
};
const endpoint = `/api/v${apiVersion}/integrations/ttn/v3`;
const ttnPayload = createTTNPayload();
describe("tests for the ttn integration", () => {
  beforeAll(async () => {
    await connectPool();
  });
  // eslint-disable-next-line jest/no-hooks
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
      url: endpoint,
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"message\\":\\"Route GET:/api/v3/integrations/ttn/v3 not found\\",\\"error\\":\\"Not Found\\",\\"statusCode\\":404}"`
    );
  });
  test("should be rejected due to no body", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: endpoint,
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
      url: endpoint,
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"body should have required property 'end_device_ids', body should have required property 'received_at', body should have required property 'uplink_message'\\"}"`
    );
  });
  test("should be rejected due to no authorization header", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: endpoint,
      payload: ttnPayload,
    });
    expect(response.statusCode).toBe(400);
  });
  test("should find no device", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    // end boilerplate

    const response = await server.inject({
      method: "POST",
      url: endpoint,
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
    await deleteUser(user.token);
  });
  test("should find no authtoken", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);

    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const url = authtokenEndpoint;

    const getResponse = await server.inject({
      method: "GET",
      url: `${url}`,
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
        nice_id: parsedGetRes.data[0].nice_id,
      },
    });
    const response = await server.inject({
      method: "POST",
      url: endpoint,
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
    await deleteUser(user.token);
  });

  test("should pass", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    await createSensor({
      user_id: user.id,
      external_id: ttnPayload.end_device_ids.device_id,
    });
    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    // end boilerplate
    const response = await server.inject({
      method: "POST",
      url: endpoint,
      payload: ttnPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.statusCode).toBe(201);
    // end boilerplate teardown test
    await deleteUser(user.token);
  });

  test("should change the lat/lon/alt of a sensor via payload of record", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const authToken = await createAuthToken({ server, userToken: user.token });
    const sensor = await createSensor({
      user_id: user.id,
      external_id: ttnPayload.end_device_ids.device_id,
    });
    const response = await server.inject({
      method: "POST",
      url: endpoint,
      payload: ttnPayload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const { data: verifySensor } = await server.supabase
      .from<Sensor>("sensors")
      .select("*")
      .eq("id", sensor.id)
      .single();
    expect(verifySensor).not.toBeNull();
    expect(response.statusCode).toBe(201);
    expect((verifySensor as Sensor).latitude).toBe(
      ttnPayload.uplink_message.locations?.user?.latitude
    );
    expect((verifySensor as Sensor).longitude).toBe(
      ttnPayload.uplink_message.locations?.user?.longitude
    );
    expect((verifySensor as Sensor).altitude).toBe(
      ttnPayload.uplink_message.locations?.user?.altitude
    );
    await deleteUser(user.token);
  });

  test("should change only lat of a sensor via payload of record", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const authToken = await createAuthToken({ server, userToken: user.token });
    const sensor = await createSensor({
      user_id: user.id,
      external_id: ttnPayload.end_device_ids.device_id,
    });
    const payload = createTTNPayload({
      uplink_message: {
        decoded_payload: {
          measurements: [1, 2, 3],
        },
        locations: {
          user: {
            latitude: 1,
          },
        },
      },
    });
    const response = await server.inject({
      method: "POST",
      url: endpoint,
      payload,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const { data: verifySensor } = await server.supabase
      .from<Sensor>("sensors")
      .select("*")
      .eq("id", sensor.id)
      .single();
    expect(verifySensor).not.toBeNull();
    expect(response.statusCode).toBe(201);
    expect((verifySensor as Sensor).latitude).toBe(
      payload.uplink_message.locations?.user?.latitude
    );
    expect((verifySensor as Sensor).longitude).toBe(sensor.longitude);
    expect((verifySensor as Sensor).altitude).toBe(sensor.altitude);
    await deleteUser(user.token);
  });
});
