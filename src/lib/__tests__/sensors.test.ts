/* eslint-disable jest/no-hooks */
// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.

import {
  buildServerOpts,
  closePool,
  createSensor,
  sensorsEndpoint,
  signupUser,
  truncateTables,
} from "../../__test-utils";
import buildServer from "../server";

// https://opensource.org/licenses/MIT
describe("sensors tests", () => {
  beforeEach(async () => {
    // await truncateTables();
  });
  // eslint-disable-next-line jest/no-hooks
  afterAll(async () => {
    // await truncateTables();
    // await closePool();
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
      url: sensorsEndpoint,
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
  });

  test("get list of all sensors GET > 0", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id, name: "test" });
    const response = await server.inject({
      method: "GET",
      url: sensorsEndpoint,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(1);
    expect(response.json().data[0]).toStrictEqual(sensor);
  });
});
