import buildServer from "./server";

describe("server tests", () => {
  test("should run the server and inject routes", async () => {
    const server = buildServer({
      jwtSecret: "mysecretneedsatleast32characters",
      supabaseUrl: "http://localhost:8080",
      supabaseServiceRoleKey: "123",
      logger: false,
      issuer: "tsb",
    });
    const response = await server.inject({ method: "GET", url: "/api/v2" });
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"comment\\":\\"Should do healthcheck\\",\\"method\\":\\"GET\\",\\"url\\":\\"/api/v2\\"}"`
    );
  });
});
