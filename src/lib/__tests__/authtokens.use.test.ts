/* eslint-disable @typescript-eslint/no-non-null-assertion */
// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { definitions } from "../../common/supabase";
import {
  deleteUser,
  supabaseAnonKey,
  apiVersion,
  buildServerOpts,
  truncateTables,
  signupUser,
  closePool,
  connectPool,
  createSensor,
  createTTNPayload,
} from "../../__test-utils";
import { compare } from "../crypto";
import buildServer from "../server";

describe("authtokens POST tests", () => {
  beforeAll(async () => {
    await connectPool();
  });
  beforeEach(async () => {
    await truncateTables();
  });
  afterAll(async () => {
    // await truncateTables();
    await closePool();
  });

  test("should be able to identify tokens by their hash", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const response1 = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        description: "testing token usage",
      },
    });

    const response2 = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        description: "testing token usage",
      },
    });

    const { token: token1 } = response1.json<{
      data: { token: string; nice_id: number };
    }>().data;

    const { token: token2 } = response2.json<{
      data: { token: string; nice_id: number };
    }>().data;

    const { data: tokens, error } = await server.supabase
      .from<definitions["auth_tokens"]>("auth_tokens")
      .select("*")
      .eq("user_id", user.id);
    expect(response1.statusCode).toBe(201);
    expect(JSON.parse(response1.body)).toMatchSnapshot({
      data: { token: expect.any(String), nice_id: expect.any(Number) },
    });
    expect(response2.statusCode).toBe(201);
    expect(JSON.parse(response2.body)).toMatchSnapshot({
      data: { token: expect.any(String), nice_id: expect.any(Number) },
    });

    expect(tokens).not.toBeNull();
    expect(error).toBeNull();
    expect(tokens!).toHaveLength(2);

    const actual1 = await compare({
      provided: token1,
      stored: tokens![0].id,
      salt: tokens![0].salt,
    });

    expect(actual1).toBeTruthy();

    const actual2 = await compare({
      provided: token2,
      stored: tokens![1].id,
      salt: tokens![1].salt,
    });

    expect(actual2).toBeTruthy();
    await deleteUser(user.token);
  });

  test("should be able to have two tokens and use them both", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const httpPayload = {
      latitude: 52.483107,
      longitude: 13.390679,
      altitude: 30,
      measurements: [1, 2, 3],
    };
    const payload = createTTNPayload({
      end_device_ids: {
        device_id: "test-device-id",
        application_ids: {
          application_id: "test-application-id",
        },
      },

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
    const httpSensor = await createSensor({
      user_id: user.id,
      name: "test with multiple tokens",
    });
    const ttnSensor = await createSensor({
      user_id: user.id,
      name: "test with multiple tokens",
      external_id: payload.end_device_ids.device_id,
    }); //?

    const url = `/api/v${apiVersion}/authtokens`;
    const response1 = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        description: "testing token usage",
      },
    });

    const response2 = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        description: "testing token usage",
      },
    });

    const { token: token1 } = response1.json<{
      data: { token: string; nice_id: number };
    }>().data;

    const { token: token2 } = response2.json<{
      data: { token: string; nice_id: number };
    }>().data;

    const response3 = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${httpSensor.id}/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });
    const response4 = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${httpSensor.id}/records`,
      payload: httpPayload,
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });
    const response5 = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/integrations/ttn/v3`,
      payload,
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });
    const response6 = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/integrations/ttn/v3`,
      payload,
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });
    const { data: httpRecords, error: httpError } = await server.supabase
      .from<definitions["records"]>("records")
      .select("*")
      .eq("sensor_id", httpSensor.id);
    const { data: ttnRecords, error: ttnError } = await server.supabase
      .from<definitions["records"]>("records")
      .select("*")
      .eq("sensor_id", httpSensor.id);

    expect(response3.statusCode).toBe(201);
    expect(response4.statusCode).toBe(201);
    expect(response5.statusCode).toBe(201);
    expect(response6.statusCode).toBe(201);
    expect(httpRecords).not.toBeNull();
    expect(ttnRecords).not.toBeNull();
    expect(httpError).toBeNull();
    expect(ttnError).toBeNull();
    expect(httpRecords!).toHaveLength(2);
    expect(ttnRecords!).toHaveLength(2);
    // start boilerplate delete user
    // await deleteUser(user.token);
    // end boilerplate
  });
});
