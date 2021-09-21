import buildServer from "../server";
import {
  deleteUser,
  supabaseAnonKey,
  apiVersion,
  buildServerOpts,
  jwtSecret,
  supabaseUrl,
  truncateTables,
  signupUser,
  createAuthToken,
} from "../../__test-utils";
import { closePool } from "../../__test-utils/truncate-tables";

describe("authtokens DELETE tests", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeEach(async () => {
    await truncateTables();
  });
  // eslint-disable-next-line jest/no-hooks
  afterAll(async () => {
    await truncateTables();
    await closePool();
  });

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip("should get a internal server error", async () => {
    const server = buildServer({
      jwtSecret,
      supabaseUrl,
      supabaseServiceRoleKey: "123",
      logger: false,
      issuer: "tsb",
    });
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const response = await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        nice_id: 99999,
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":500,\\"error\\":\\"Internal Server Error\\",\\"message\\":\\"Internal Server Error\\"}"`
    );
    await deleteUser(user.token);
  });
  test("should delete a token by its id", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    await createAuthToken({
      server,
      userToken: user.token,
    });

    const url = `/api/v${apiVersion}/authtokens`;

    const getResponse = await server.inject({
      method: "GET",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
    });

    const parsedGetRes = JSON.parse(getResponse.body);
    const deleteResponse = await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        nice_id: parsedGetRes.data[0].nice_id,
      },
    });
    const anothergetResponse = await server.inject({
      method: "GET",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
    });
    const anotherParsedGetResponse = JSON.parse(anothergetResponse.body);
    expect(anotherParsedGetResponse.data).toHaveLength(0);
    expect(deleteResponse.statusCode).toBe(204);
    await deleteUser(user.token);
  });
  test("should not find the token", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const response = await server.inject({
      method: "DELETE",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        nice_id: 99999,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":404,\\"error\\":\\"Not Found\\",\\"message\\":\\"token not found\\"}"`
    );
    await deleteUser(user.token);
  });
});
