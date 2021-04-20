/* eslint-disable jest/no-hooks */
import "global-agent/bootstrap";
import buildServer from "./server";
import { setupMSWServer } from "../mocks/server";
const supabaseUrl = "https://dyxublythmmlsositxtg.supabase.co";
const server = setupMSWServer(new URL(supabaseUrl));
const jwtSecret = process.env.JWT_SECRET || "mysecretneedsatleast32characters";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxODQwOTgzMiwiZXhwIjoxOTMzOTg1ODMyfQ.NdUHVmj8xSEvAInZfovt4r_LSsnstuVPwdvZvMz50yMs";
const apikey = supabaseAnonKey;
// import nock from "nock";
// let supabaseMock: nock.Scope;
import { sign } from "jsonwebtoken";
describe("server tests", () => {
  // beforeEach(() => {
  //   supabaseMock = nock(supabaseUrl);
  // });
  // afterEach(() => {
  //   supabaseMock.done();
  //   nock.cleanAll();
  // });

  beforeAll(() => {
    // Enable the mocking in tests.
    server.listen({
      onUnhandledRequest(req) {
        console.error(
          "Found an unhandled %s request to %s",

          req.method,

          req.url.href
        );
      },
    });
  });

  afterEach(() => {
    // Reset any runtime handlers tests may use.
    server.resetHandlers();
    server.printHandlers();
  });

  afterAll(() => {
    // Clean up once the tests are done.
    server.close();
  });
  test("should run the server and inject routes", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey: "123",
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
      supabaseServiceRoleKey: "123",
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

  test("should complain GET", async () => {
    // supabase[Mock.get("/rest/v1/authtokens", {});
    const token = await sign({ sub: "123" }, jwtSecret);
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey: "123",
      logger: false,
      issuer: "tsb",
    });

    const response = await server.inject({
      method: "GET",
      url: "/api/v2/authtokens?projectId=123",
      headers: {
        authorization: `Bearer ${token}`,
        apikey,
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"comment\\":\\"Should return array of tokenIds and description\\",\\"method\\":\\"GET\\",\\"url\\":\\"/api/v2/authtokens?projectId=123\\",\\"data\\":[{\\"id\\":\\"$2b$10$/LKvAbv/D/8ASjrR3uAupOqHEqFN70RdSvKd6yJUhFDD.dowJn3Je\\",\\"description\\":\\"my fancy token\\",\\"projectId\\":28,\\"userId\\":\\"ede34664-574f-4558-bc42-695b184d5ccd\\",\\"niceId\\":27}]}"`
    );
  });
});
