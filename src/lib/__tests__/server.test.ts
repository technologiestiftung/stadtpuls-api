/* eslint-disable jest/no-hooks */
import buildServer from "../server";
import {
  supabaseUrl,
  supabaseServiceRoleKey,
  jwtSecret,
  apiVersion,
} from "../../__test-utils";

const buildServerOpts = {
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger: false,
  issuer: "tsb",
};
describe("authtokens tests", () => {
  test("should run the server and inject routes", async () => {
    const server = buildServer(buildServerOpts);

    const response = await server.inject({
      method: "GET",
      url: `/api/v${apiVersion}`,
    });
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"comment\\":\\"healthcheck\\",\\"method\\":\\"GET\\",\\"url\\":\\"/api/v3\\"}"`
    );
  });
});
