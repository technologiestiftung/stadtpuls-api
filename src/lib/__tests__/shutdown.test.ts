import {
  apiVersion,
  authtokenEndpoint,
  buildServerOpts,
  closePool,
  connectPool,
  createAuthToken,
  createSensor,
  CreateTokenFullResponse,
  deleteUser,
  purgeInbox,
  sensorsEndpoint,
  signupUser,
  truncateTables,
} from "../../__test-utils";
import { createAuthTokenNotWithAPI } from "../../__test-utils/create-auth-token";
import { createRecords } from "../../__test-utils/create-records";
import * as envs from "../env";

import buildServer from "../server";

const signupUrl = `/api/v${apiVersion}/signup`;

describe("shutdown flag handling", () => {
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
  test("should responde with 404 when in grace period on signup", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 1 });
    const name = "ff6347";
    const email = "me@email.com";
    await purgeInbox(email.split("@")[0]);
    const response = await server.inject({
      method: "POST",
      url: signupUrl,
      payload: {
        email,
        name,
      },
    });
    expect(response.statusCode).toBe(404);
  });
  test("should responde with 404 when in shutdown on signup", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const name = "ff6347";
    const email = "me@email.com";
    await purgeInbox(email.split("@")[0]);
    const response = await server.inject({
      method: "POST",
      url: signupUrl,
      payload: {
        email,
        name,
      },
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Signup is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
  });

  test("should responde with 404 when in shutdown on login", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const name = "ff6347";
    const email = "me@email.com";
    const user = await signupUser(name, email);

    const response = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/signin`,
      payload: { email },
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Signin is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });

  test("should responde with 404 when in shutdown on sensors", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const user = await signupUser();
    const response = await server.inject({
      method: "GET",
      url: `/api/v${apiVersion}/sensors`,
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Sensors and records creation and retrieval is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });

  test("should responde with 404 when in shutdown on specific sensor", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id });
    const response = await server.inject({
      method: "GET",
      url: `${sensorsEndpoint}/${sensor.id}`,
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Sensors and records creation and retrieval is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });

  test("should responde with 404 when getting records in shutdown mode", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id });
    await createRecords({
      sensor_id: sensor.id,
      numberOfRecords: 10,
    });

    const url = `${sensorsEndpoint}/${sensor.id}/records/`;

    const response = await server.inject({
      method: "GET",
      url: url,
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Sensors and records creation and retrieval is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });

  test("should responde with 404 when getting specific record in shutdown mode", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id });
    const records = await createRecords({
      sensor_id: sensor.id,
      numberOfRecords: 10,
    });

    const url = `${sensorsEndpoint}/${sensor.id}/records/${records[0].id}`;

    const response = await server.inject({
      method: "GET",
      url: url,
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Route GET:/api/v3/sensors/1/records/1 not found",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });

  test("should responde with 404 when creating records in shutdown mode", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id });
    await createRecords({
      sensor_id: sensor.id,
      numberOfRecords: 10,
    });

    const url = `${sensorsEndpoint}/${sensor.id}/records/`;
    const response = await server.inject({
      method: "POST",
      url: url,
      payload: {
        records: [
          {
            value: 10,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Sensors and records creation and retrieval is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });

  test("should responde with 404 when creating authtokens in shutdown mode", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const user = await signupUser();

    const url = `${authtokenEndpoint}`;
    const response = await server.inject({
      method: "POST",
      url: url,
      headers: {
        authorization: `Bearer ${user.token}`,
      },
      payload: {
        description: "test",
      },
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Authtoken retrieval is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });

  test("should responde with 404 when getting authtokens in shutdown mode", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const user = await signupUser();

    const url = `${authtokenEndpoint}`;
    const response = await server.inject({
      method: "GET",
      url: url,
      headers: {
        authorization: `Bearer ${user.token}`,
      },
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Authtoken retrieval is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });

  test("should responde with 404 when regenerating authtokens in shutdown mode", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const user = await signupUser();
    const entireAuthResponse = (await createAuthTokenNotWithAPI({
      userId: user.id,
      getFullResponse: true,
    })) as CreateTokenFullResponse;

    const url = `${authtokenEndpoint}`;
    const response = await server.inject({
      method: "PUT",
      url: url,
      headers: {
        authorization: `Bearer ${user.token}`,
      },
      payload: {
        // description: "new description of rotated token",
        nice_id: entireAuthResponse.nice_id,
      },
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Authtoken retrieval is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });

  test("should responde with 404 when deleting authtokens in shutdown mode", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const user = await signupUser();
    const entireAuthResponse = (await createAuthTokenNotWithAPI({
      userId: user.id,
      getFullResponse: true,
    })) as CreateTokenFullResponse;

    const url = `${authtokenEndpoint}`;
    const response = await server.inject({
      method: "DELETE",
      url: url,
      headers: {
        authorization: `Bearer ${user.token}`,
      },
      payload: {
        nice_id: entireAuthResponse.nice_id,
      },
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "Authtoken retrieval is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });

  test("should responde with 404 when posting data via ttn integration in shutdown mode", async () => {
    const server = buildServer({ ...buildServerOpts, shutdownLevel: 2 });
    const user = await signupUser();
    const sensor = await createSensor({
      user_id: user.id,
      external_id: "test",
    });

    const url = `/api/v${apiVersion}/integrations/ttn/v3`;
    const response = await server.inject({
      method: "POST",
      url: url,
      headers: {
        authorization: `Bearer ${user.token}`,
      },
      payload: {
        dev_id: sensor.id,
        payload_fields: {
          value: 10,
        },
      },
    });
    expect(response.statusCode).toBe(404);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Not Found",
        "message": "TTN integration is disabled - we are in shutdown mode. Please see https://stadtpuls.com for further information",
        "statusCode": 404,
      }
    `);
    await deleteUser(user.token);
  });
});
