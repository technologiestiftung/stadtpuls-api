/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/no-hooks */
// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.

// https://opensource.org/licenses/MIT
import { definitions } from "../../common/supabase";
import {
  buildServerOpts,
  closePool,
  connectPool,
  createSensor,
  sensorsEndpoint,
  signupUser,
  truncateTables,
} from "../../__test-utils";
import { createRecords } from "../../__test-utils/create-records";
import buildServer from "../server";
type JsonResponseRecords = {
  url: string;
  nextPage?: string;
  data: definitions["records"][];
};

beforeAll(async () => {
  await connectPool();
});
beforeEach(async () => {
  await truncateTables();
});
afterAll(async () => {
  await truncateTables();
  await closePool();
});
describe(`${sensorsEndpoint}/:sensorId/records tests`, () => {
  test("should get rejected with 404 due to non existing sensor", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "GET",
      url: `${sensorsEndpoint}/1/records`,
    });

    // console.log(response.body);
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"Not Found\\"}"`
    );
  });
  test("should get empty response due to no records", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id });
    // const records = await createRecords({
    //   sensor_id: sensor.id,
    //   numberOfRecords: 2000,
    // });
    const response = await server.inject({
      method: "GET",
      url: `${sensorsEndpoint}/${sensor.id}/records`,
    });

    const json = response.json<JsonResponseRecords>();
    expect(response.statusCode).toBe(200);
    expect(json.data).toHaveLength(0);
  });

  test("should get response with HEAD", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id });
    await createRecords({
      sensor_id: sensor.id,
      numberOfRecords: 10,
    });
    const response = await server.inject({
      method: "HEAD",
      url: `${sensorsEndpoint}/${sensor.id}/records`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("");
    expect(response.headers["content-range"]).toBeDefined();
    expect(response.headers["content-range"]).toBe("0-*/10");

    expect(response.headers["range-unit"]).toBeDefined();
    expect(response.headers["range-unit"]).toBe("record");
  });

  test("should get response with 1000 no nextPage", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id });
    await createRecords({
      sensor_id: sensor.id,
      numberOfRecords: 1000,
    });
    const response = await server.inject({
      method: "GET",
      url: `${sensorsEndpoint}/${sensor.id}/records`,
    });

    const json = response.json<JsonResponseRecords>();
    expect(response.statusCode).toBe(200);
    expect(json.data).toHaveLength(1000);
    expect(json.nextPage).not.toBeDefined();
  });

  test("should get response with 1000 and nextPage", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id });
    await createRecords({
      sensor_id: sensor.id,
      numberOfRecords: 2000,
    });
    const response = await server.inject({
      method: "GET",
      url: `${sensorsEndpoint}/${sensor.id}/records`,
    });

    const json = response.json<JsonResponseRecords>();
    expect(response.statusCode).toBe(200);
    expect(json.data).toHaveLength(1000);
    expect(json.nextPage).toBeDefined();
    expect(json.nextPage).toMatchInlineSnapshot(
      `"/api/v3/sensors/1/records?offset=1000&limit=1000"`
    );

    expect(response.headers["content-range"]).toBeDefined();
    expect(response.headers["content-range"]).toBe("0-999/*");

    expect(response.headers["range-unit"]).toBeDefined();
    expect(response.headers["range-unit"]).toBe("record");
  });
});
