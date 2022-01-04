// Copyright (c) 2021-2022 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { LightMyRequestResponse } from "fastify";
import {
  deleteUser,
  supabaseAnonKey,
  apiVersion,
  buildServerOpts,
  truncateTables,
  signupUser,
  closePool,
  connectPool,
} from "../../__test-utils";
import buildServer from "../server";

describe("authtokens POST tests", () => {
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
  test("tokens should never have more then 256 characters", async () => {
    const iterations = 100;
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    // POST test
    const url = `/api/v${apiVersion}/authtokens`;
    const postResponses: LightMyRequestResponse[] = [];
    for (let i = 0; i < iterations; i++) {
      const response = await server.inject({
        method: "POST",
        url,
        headers: {
          authorization: `Bearer ${user.token}`,
          apikey: supabaseAnonKey,
        },
        payload: {
          description: "testing",
        },
      });
      postResponses.push(response);
    }

    const postStatusCodes = postResponses.map((res) => res.statusCode);
    const postAllAre201 = postStatusCodes.every((code) => code === 201);

    const postTokenLengths: number[] = postResponses.map(
      (res: LightMyRequestResponse) => {
        const actual = `Bearer ${res.json().data.token}`;
        return actual.length;
      }
    );
    const postAllAreLessThen256 = postTokenLengths.every(
      (length) => length <= 256
    );

    expect(postAllAre201).toBe(true);
    expect(postAllAreLessThen256).toBe(true);

    // PUT test
    const putResponses: LightMyRequestResponse[] = [];
    for (let i = 0; i < postResponses.length; i++) {
      const json = postResponses[i].json<{ data: { nice_id: number } }>();
      const response = await server.inject({
        method: "PUT",
        url,
        headers: {
          authorization: `Bearer ${user.token}`,
          apikey: supabaseAnonKey,
        },
        payload: {
          nice_id: json.data.nice_id,
        },
      });
      putResponses.push(response);
    }
    // console.log(putResponses.map((res) => res.json()));

    const putStatusCodes = postResponses.map((res) => res.statusCode);
    const putAllAre201 = putStatusCodes.every((code) => code === 201);

    const putTokenLengths: number[] = putResponses.map(
      (res: LightMyRequestResponse) => {
        const actual = `Bearer ${res.json().data.token}`;
        return actual.length;
      }
    );
    const putAllAreLessThen256 = putTokenLengths.every(
      (length) => length <= 256
    );
    expect(putAllAre201).toBe(true);
    expect(putAllAreLessThen256).toBe(true);
    // boilerplate teardown
    await deleteUser(user.token);
  });
});
