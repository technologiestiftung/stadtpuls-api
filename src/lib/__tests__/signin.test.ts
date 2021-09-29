/* eslint-disable jest/no-hooks */
// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import {
  apiVersion,
  buildServerOpts,
  signinUser,
  truncateTables,
} from "../../__test-utils";
import { closePool } from "../../__test-utils/truncate-tables";
import buildServer from "../server";

const signinUrl = `/api/v${apiVersion}/signin`;
describe("signin POST tests", () => {
  beforeEach(async () => {
    await truncateTables();
  });
  // eslint-disable-next-line jest/no-hooks
  afterAll(async () => {
    await truncateTables();
    await closePool();
  });
  test("should be rejected due to missing body", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: signinUrl,
    });
    expect(response.statusCode).toBe(400);
  });
  test("should be rejected due to missing body property email", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: signinUrl,
      payload: {},
    });
    expect(response.statusCode).toBe(400);
  });

  test("should be rejected due to email already taken", async () => {
    const server = buildServer(buildServerOpts);
    const email = "me@email.com";
    await signinUser(email);

    const response = await server.inject({
      method: "POST",
      url: signinUrl,
      payload: { email },
    });
    expect(response.statusCode).toBe(409);
  });
});
