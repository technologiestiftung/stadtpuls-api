/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/no-hooks */
// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { definitions } from "@technologiestiftung/stadtpuls-supabase-definitions";
import {
  buildServerOpts,
  closePool,
  connectPool,
  createSensor,
  createSensors,
  maxRows,
  sensorsEndpoint,
  signupUser,
  truncateTables,
} from "../../__test-utils";
import buildServer from "../server";
const sensorSnapshotDescription = {
  data: [
    {
      altitude: expect.any(Number),
      category: {
        id: expect.any(Number),
        description: expect.any(String),
        name: expect.any(String),
      },
      author: {
        name: expect.any(String),
        display_name: null,
      },
      connection_type: "http",
      created_at: expect.any(String),
      description: null,
      external_id: null,
      icon_id: null,
      id: 1,
      latitude: expect.any(Number),
      location: null,
      longitude: expect.any(Number),
      name: "test",
    },
  ],
};
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
describe(`all ${sensorsEndpoint} tests`, () => {
  test("should be rejected due to wrong query string", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "GET",
      url: `${sensorsEndpoint}?wrong=param`,
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchInlineSnapshot(`
      Object {
        "error": "Bad Request",
        "message": "querystring should NOT have additional properties",
        "statusCode": 400,
      }
    `);
  });
  test("list of all sensors GET (empty)", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "GET",
      url: sensorsEndpoint,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toStrictEqual({
      data: [],
    });
  });
  test("list of all sensors HEAD", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "HEAD",
      url: sensorsEndpoint,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("");
    expect(response.headers["content-range"]).toBeDefined();
    expect(response.headers["range-unit"]).toBeDefined();
  });

  test("get list of all sensors GET > 0", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    await createSensor({ user_id: user.id, name: "test" });
    const response = await server.inject({
      method: "GET",
      url: sensorsEndpoint,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(1);
    expect(response.json().data[0]).toMatchSnapshot(
      sensorSnapshotDescription.data[0]
    );
  });

  test(`get list of all sensors GET > ${maxRows} should have pagination`, async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    await createSensors(user.id, maxRows * 2);
    const response = await server.inject({
      method: "GET",
      url: sensorsEndpoint,
    });
    const json = response.json<{
      url: string;
      nextPage: string;
      data: Omit<definitions["sensors"], "user_id">[];
    }>();
    const lastItem = json.data[json.data.length - 1];
    expect(json).toMatchSnapshot({
      data: expect.any(Array),
      nextPage: `/api/v3/sensors?offset=${maxRows}&limit=${maxRows}`,
    });
    expect(lastItem.id).toBe(maxRows);
    expect(response.statusCode).toBe(200);

    // make another request
    const response2 = await server.inject({
      method: "GET",
      url: json.nextPage,
    });
    const json2 = response2.json<{
      nextPage: string;
      data: Omit<definitions["sensors"], "user_id">[];
    }>();

    expect(response2.statusCode).toBe(200);
    expect(json2.data[0].id).toBe(maxRows + 1);
  });
});

describe(`single ${sensorsEndpoint}/:sensorId tests`, () => {
  test("should give us 404 response", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "HEAD",
      url: `${sensorsEndpoint}/1`,
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"Not Found\\"}"`
    );
  });
  test("should give us HEAD response", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id, name: "test" });
    const response = await server.inject({
      method: "HEAD",
      url: `${sensorsEndpoint}/${sensor.id}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("");
    expect(response.headers["content-range"]).toBeDefined();
    expect(response.headers["range-unit"]).toBeDefined();
  });
  test("should give us the sensor response", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id, name: "test" });
    const response = await server.inject({
      method: "GET",
      url: `${sensorsEndpoint}/${sensor.id}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchSnapshot(sensorSnapshotDescription);
  });
});
