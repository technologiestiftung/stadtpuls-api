import buildServer from "./server";
import {
  deleteUser,
  jwtSecret,
  supabaseAnonKey,
  signupUser,
  createAuthToken,
  authtokenEndpoint,
  CreateTokenFullResponse,
  buildServerOpts,
} from "../__test-utils";
import jwt from "jsonwebtoken";
import { AuthToken } from "../common/jwt";

describe("tests for authtokens PUT method", () => {
  test("should update an existing token and compare properties", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const entireAuthResponse = (await createAuthToken({
      server,
      userToken: user.token,
      getFullResponse: true,
    })) as CreateTokenFullResponse;
    // teardown
    const url = authtokenEndpoint;

    const response = await server.inject({
      method: "PUT",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        nice_id: entireAuthResponse.nice_id,
      },
    });
    const decodedOldToken = jwt.verify(
      entireAuthResponse.token,
      jwtSecret
    ) as AuthToken;
    const parsed = response.json().data;
    const decodedNewToken = jwt.verify(parsed.token, jwtSecret) as AuthToken;

    expect(response.statusCode).toBe(201);
    expect(decodedNewToken.description).toBe(decodedOldToken.description);
    expect(decodedNewToken.sub).toBe(decodedOldToken.sub);
    expect(decodedNewToken.scope).toBe(decodedOldToken.scope);
    expect(decodedNewToken.iss).toBe(decodedOldToken.iss);
    expect(decodedNewToken.jti).not.toBe(decodedOldToken.jti);
    await deleteUser(user.token);
  });
});
