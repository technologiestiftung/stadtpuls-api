/* eslint-disable jest/no-hooks */
import buildServer from "./server";
import faker from "faker";
import { createClient } from "@supabase/supabase-js";
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
const password = "1234password";
import { login, logout, signup } from "../__test-utils";
import { definitions } from "../common/supabase";
describe("server tests", () => {
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

  test("should run the server and inject routes", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });

    const response = await server.inject({ method: "GET", url: "/api/v2" });
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"comment\\":\\"healthcheck\\",\\"method\\":\\"GET\\",\\"url\\":\\"/api/v2\\"}"`
    );
  });

  test("should complain on GET with 400 due to bad querystring", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });

    const response = await server.inject({
      method: "GET",
      url: "/api/v2/authtokens",
      headers: { apikey },
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":400,\\"error\\":\\"Bad Request\\",\\"message\\":\\"querystring should have required property 'projectId'\\"}"`
    );
  });

  test("should GET an empty list of tokens for that user", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey,
      logger: false,
      issuer: "tsb",
    });
    const { data: project, error } = await supabase
      .from<definitions["projects"]>("projects")
      .insert([{ name: "test", userId, categoryId: 1 }]);
    if (!project) {
      throw error;
    }

    const response = await server.inject({
      method: "GET",
      url: `/api/v2/authtokens?projectId=${project[0].id}`,
      headers: {
        authorization: `Bearer ${userToken}`,
        apikey: supabaseAnonKey,
      },
    });
    // console.log(response);
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchInlineSnapshot();
  });
});
