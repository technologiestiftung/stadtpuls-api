import buildServer from "../server";
import {
  deleteUser,
  supabaseAnonKey,
  signupUser,
  buildServerOpts,
  authtokenEndpoint,
  createAuthToken,
  CreateTokenFullResponse,
  truncateTables,
} from "../../__test-utils";

describe("authtokens GET tests", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeEach(async () => {
    await truncateTables();
  });
  test("should complain on GET with 401 due to missing token", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "GET",
      url: authtokenEndpoint,
      headers: { apikey: supabaseAnonKey },
    });
    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchInlineSnapshot(
      `"{\\"statusCode\\":401,\\"error\\":\\"Unauthorized\\",\\"message\\":\\"No Authorization was found in request.headers\\"}"`
    );
  });

  test("should GET an empty list of tokens for that user", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const url = authtokenEndpoint;
    const response = await server.inject({
      method: "GET",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
    });
    // console.log(response);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchSnapshot({
      url: expect.any(String),
    });
    await deleteUser(user.token);
  });

  test("should GET only one token using a query", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const token1 = (await createAuthToken({
      server,
      userToken: user.token,
      getFullResponse: true,
    })) as CreateTokenFullResponse;
    await createAuthToken({ server, userToken: user.token });

    const response = await server.inject({
      method: "GET",
      url: `${authtokenEndpoint}?nice_id=${token1.nice_id}`,
      headers: {
        authorization: `Bearer ${user.token}`,
      },
    });
    const { data } = response.json();
    expect(data).toHaveLength(1);
    await deleteUser(user.token);
  });
});
