/* eslint-disable jest/require-top-level-describe */

import { definitions } from "@technologiestiftung/stadtpuls-supabase-definitions";
import {
  connectPool,
  truncateTables,
  closePool,
  buildServerOpts,
  createSensor,
  sensorsEndpoint,
  signupUser,
  maxRows,
} from "../../__test-utils";
import { createRecords } from "../../__test-utils/create-records";
import buildServer from "../server";

type JsonResponseRecords = {
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
describe("pagination", () => {
  test("should have pagination with limit and offset", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id });
    await createRecords({
      sensor_id: sensor.id,
      numberOfRecords: maxRows * 3,
    });
    const response1 = await server.inject({
      method: "GET",
      url: `${sensorsEndpoint}/${sensor.id}/records`,
    });
    const json1 = response1.json<JsonResponseRecords>();

    expect(json1.data).toHaveLength(maxRows);
    expect(json1.nextPage).toBeDefined();
    expect(json1.nextPage).toMatchInlineSnapshot(
      `"/api/v3/sensors/1/records?offset=3000&limit=3000"`
    );

    const response2 = await server.inject({
      method: "GET",
      url: json1.nextPage,
    });
    const json2 = response2.json<JsonResponseRecords>();
    expect(json2.nextPage).toMatchInlineSnapshot(
      `"/api/v3/sensors/1/records?offset=6000&limit=3000"`
    );
    const response3 = await server.inject({
      method: "GET",
      url: json2.nextPage,
    });
    const json3 = response3.json<JsonResponseRecords>();
    expect(json3.nextPage).toMatchInlineSnapshot(
      `"/api/v3/sensors/1/records?offset=9000&limit=3000"`
    );
  });
});
