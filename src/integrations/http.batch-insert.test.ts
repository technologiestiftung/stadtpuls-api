/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/no-hooks */
import buildServer from "../lib/server";
import each from "jest-each";
import {
  deleteUser,
  jwtSecret,
  supabaseServiceRoleKey,
  supabaseUrl,
  apiVersion,
  signupUser,
  createSensor,
  truncateTables,
  closePool,
  connectPool,
} from "../__test-utils";
import { createAuthToken } from "../__test-utils/create-auth-token";
import { createRecordsPayload } from "../__test-utils/create-records";
import { recordsMaxLength } from "../lib/env";

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
  recorded_at: "2022-03-30T00:00:00.000Z",
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

  test("should allow array of data or object in body", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const sensor = await createSensor({
      user_id: user.id,
    });
    // end boilerplate
    const records = await createRecordsPayload({
      amount: 100,
    });
    const responseArray = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      payload: { records },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const responseObject = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      payload: records[0],
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(responseArray.statusCode).toBe(201);
    expect(responseObject.statusCode).toBe(201);
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });

  test("should prefer array of data before object in body", async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const sensor = await createSensor({
      user_id: user.id,
    });
    // end boilerplate
    const records = await createRecordsPayload({
      amount: 2,
    });
    const responseArray = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      payload: { records, measurements: [1, 2, 3] },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(responseArray.statusCode).toBe(201);
    expect(responseArray.json().records).toBeDefined();
    expect(responseArray.json().record).not.toBeDefined();
    expect(responseArray.json().records.length).toBeGreaterThan(1);
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });

  test(`should allow around 1 mb of payload`, async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const sensor = await createSensor({
      user_id: user.id,
    });
    // end boilerplate
    const records = await createRecordsPayload({
      amount: 1,
    });
    const oneMBInBytes = 1048576; // 1024 * 1024

    let jsonString = JSON.stringify(records);
    const bytesOfSkeleton = Buffer.byteLength(jsonString, "utf8");
    const bytesOfMeasurements = oneMBInBytes - bytesOfSkeleton;

    const measurements = [];
    for (let i = 0; i < bytesOfMeasurements / 2 - 10; i++) {
      measurements.push(1);
    }

    records[0].measurements = measurements;
    jsonString = JSON.stringify(records);
    // console.log(bytesOfSkeleton, Buffer.byteLength(jsonString, "utf8"));

    const responseArray = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      payload: { records },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(responseArray.statusCode).toBe(201);

    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });

  test(`should reject large payload with 413`, async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const sensor = await createSensor({
      user_id: user.id,
    });
    // end boilerplate
    const records = await createRecordsPayload({
      amount: 1,
    });
    const oneMBInBytes = 1048576; // 1024 * 1024

    let jsonString = JSON.stringify(records);
    const bytesOfSkeleton = Buffer.byteLength(jsonString, "utf8");
    const bytesOfMeasurements = oneMBInBytes - bytesOfSkeleton;

    const measurements = [];
    for (let i = 0; i < bytesOfMeasurements; i++) {
      measurements.push(1);
    }

    records[0].measurements = measurements;
    jsonString = JSON.stringify(records);
    // console.log(bytesOfSkeleton, Buffer.byteLength(jsonString, "utf8"));

    const responseArray = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      payload: { records },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(responseArray.statusCode).toBe(413);
    expect(responseArray.json()).toMatchInlineSnapshot(`
      Object {
        "code": "FST_ERR_CTP_BODY_TOO_LARGE",
        "error": "Payload Too Large",
        "message": "Request body is too large",
        "statusCode": 413,
      }
    `);
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });
  test(`should reject records missing measurements`, async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const sensor = await createSensor({
      user_id: user.id,
    });
    // end boilerplate
    const records = await createRecordsPayload({
      amount: 1000,
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    records[5].measurements = undefined;
    const responseArray = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      payload: { records },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(responseArray.statusCode).toBe(400);
    expect(responseArray.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Bad Request",
        "message": "body/records/5 should have required property 'measurements', body should match \\"then\\" schema",
        "statusCode": 400,
      }
    `);
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });

  test(`should reject records missing recorded_at`, async () => {
    // start boilerplate setup test
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const authToken = await createAuthToken({
      server,
      userToken: user.token,
    });
    const sensor = await createSensor({
      user_id: user.id,
    });
    // end boilerplate
    const records = await createRecordsPayload({
      amount: 1000,
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    records[5].recorded_at = undefined;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    records[100].recorded_at = undefined;
    const responseArray = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      payload: { records },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(responseArray.statusCode).toBe(400);
    expect(responseArray.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Bad Request",
        "message": "body/records/5 should have required property 'recorded_at', body/records/100 should have required property 'recorded_at', body should match \\"then\\" schema",
        "statusCode": 400,
      }
    `);
    // start boilerplate delete user
    await deleteUser(user.token);
    // end boilerplate
  });
});
