/* eslint-disable jest/no-hooks */
import buildServer from "../lib/server";
import faker from "faker";
import { createClient } from "@supabase/supabase-js";

import { verify } from "jsonwebtoken";
const supabaseUrl = "http://localhost:8000";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "123";
const jwtSecret =
  process.env.JWT_SECRET ||
  "super-secret-jwt-token-with-at-least-32-characters-long";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "123";
const apikey = supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
let userToken: string;
let userId: string;
const email = faker.internet.email();
const password = faker.internet.password();
import { deleteUser, JWTPayload, login, logout, signup } from "../__test-utils";
import { definitions } from "../common/supabase";
const issuer = "tsb";

const ttnPayload = {
  end_device_ids: {
    device_id: "123",
    dev_eui: "0909120192",
  },
  received_at: new Date().toISOString(),
  uplink_message: {
    decoded_payload: { measurements: [1, 2, 3] },
    locations: { user: { latitude: 13, longitude: 52, altitude: 23 } },
  },
};
describe("tests for the ttn integration", () => {
  beforeEach(async () => {
    const { id, token } = await login({
      anonKey: supabaseAnonKey,
      email,
      password,
      url: new URL(`${supabaseUrl}/auth/v1/token?grant_type=password`),
    });
    userId = id;
    userToken = token;
  });
  afterEach(async () => {
    const success = await logout({
      userToken,
      anonKey: supabaseAnonKey,
      url: new URL(`${supabaseUrl}/auth/v1/logout`),
    });
    if (!success) {
      throw new Error("could not log out");
    }
  });

  beforeAll(async () => {
    const { id, token } = await signup({
      anonKey: supabaseAnonKey,
      email,
      password,
      url: new URL(`${supabaseUrl}/auth/v1/signup`),
    });
    userId = id;
    userToken = token;
  });

  afterAll(async () => {
    const success = await deleteUser({
      anonKey: supabaseAnonKey,
      userToken,
      url: new URL(`${supabaseUrl}/rest/v1/rpc/delete_user`),
    });
    if (!success) {
      throw new Error("could not delete user");
    }
  });

  test("should be rejected due to no no GET route", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const response = await server.inject({
      method: "GET",
      url: "/api/v2/integrations/ttn/v3",
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"message\\":\\"Route GET:/api/v2/integrations/ttn/v3 not found\\",\\"error\\":\\"Not Found\\",\\"statusCode\\":404}"`
    );
  });
  test("should be rejected due to no body", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/integrations/ttn/v3",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"body should be object\\"}"`
    );
  });
  test("should be rejected due to no wrong body", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/integrations/ttn/v3",
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"body should have required property 'end_device_ids'\\"}"`
    );
  });
  test("should be rejected due to no token", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/integrations/ttn/v3",
      payload: ttnPayload,
    });
    expect(response.statusCode).toBe(401);
  });

  test("should find no device", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const { data: projects, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!projects) {
      throw error;
    }

    const url = `/api/v2/authtokens`;
    const responseToken = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: projects[0].id,
        description: "testing",
      },
    });

    const resBody = JSON.parse(responseToken.body);
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/integrations/ttn/v3",
      payload: ttnPayload,
      headers: {
        Authorization: `Bearer ${resBody.data.token}`,
      },
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"device not found\\"}"`
    );
  });

  test("should pass", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const { data: projects, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!projects) {
      throw error;
    }

    const { data: devices, error: dError } = await supabase
      .from<definitions["devices"]>("devices")
      .insert([
        {
          name: "test",
          userId,
          projectId: projects[0].id,
          externalId: ttnPayload.end_device_ids.dev_eui,
        },
      ]);
    if (!devices) {
      throw dError;
    }

    const url = `/api/v2/authtokens`;
    const responseToken = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        projectId: projects[0].id,
        description: "testing",
      },
    });

    const resBody = JSON.parse(responseToken.body);
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/integrations/ttn/v3",
      payload: ttnPayload,
      headers: {
        Authorization: `Bearer ${resBody.data.token}`,
      },
    });
    console.error(response.body);
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toMatchSnapshot({
      record: [
        {
          id: expect.any(Number),
          recordedAt: expect.any(Date),
          deviceId: expect.any(Number),
        },
      ],
    });
  });
});