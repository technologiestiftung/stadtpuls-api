/* eslint-disable jest/no-hooks */
import buildServer from "../lib/server";
import faker from "faker";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://localhost:8000";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "123";
const jwtSecret =
  process.env.JWT_SECRET ||
  "super-secret-jwt-token-with-at-least-32-characters-long";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "123";
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
let userToken: string;
let userId: string;
const email = faker.internet.email();
const password = faker.internet.password();
import { deleteUser, login, logout, signup } from "../__test-utils";
import { definitions } from "../common/supabase";
const issuer = "tsb";

const ttnPayload = {
  end_device_ids: {
    device_id: "123",
  },
  received_at: new Date().toISOString(),
  uplink_message: {
    decoded_payload: { measurements: [1, 2, 3] },
    locations: { user: { latitude: 13, longitude: 52, altitude: 23 } },
  },
};

describe("tests for the http integration", () => {
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

  test("should be rejected due to no POST body", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer,
    });
    const response = await server.inject({
      method: "POST",
      url: "/api/v2/devices/1/records",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"body should be object\\"}"`
    );
  });
});
