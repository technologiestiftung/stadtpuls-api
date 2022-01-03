import jwt from "jsonwebtoken";
import {
  deleteUser,
  jwtSecret,
  supabaseAnonKey,
  authtokenEndpoint,
  CreateTokenFullResponse,
  buildServerOpts,
  truncateTables,
  signupUser,
  createAuthToken,
  closePool,
  connectPool,
  createSensor,
  apiVersion,
} from "../../__test-utils";
import { AuthToken } from "../../common/jwt";
import buildServer from "../server";

describe("tests for authtokens PUT method", () => {
  beforeAll(async () => {
    await connectPool();
  });
  beforeEach(async () => {
    await truncateTables();
  });
  // eslint-disable-next-line jest/no-hooks
  afterAll(async () => {
    await truncateTables();
    await closePool();
  });
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
    // expect(decodedNewToken.description).toBe(decodedOldToken.description);
    expect(decodedNewToken.sub).toBe(decodedOldToken.sub);
    // expect(decodedNewToken.scope).toBe(decodedOldToken.scope);
    expect(decodedNewToken.iss).toBe(decodedOldToken.iss);
    expect(decodedNewToken.jti).not.toBe(decodedOldToken.jti);
    await deleteUser(user.token);
  });

  test("should allow user to post data with his old and new token", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id });
    const httpPayload = {
      latitude: 52.483107,
      longitude: 13.390679,
      altitude: 30,
      measurements: [1, 2, 3],
    };
    const entireAuthResponse = (await createAuthToken({
      server,
      userToken: user.token,
      getFullResponse: true,
    })) as CreateTokenFullResponse;

    const responsePOST1 = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      headers: {
        authorization: `Bearer ${entireAuthResponse.token}`,
        "content-type": "application/json",
      },
      payload: httpPayload,
    });
    expect(responsePOST1.statusCode).toBe(201);
    // rotate the token
    const responsePUT1 = await server.inject({
      url: `/api/v${apiVersion}/authtokens`,
      method: "PUT",
      headers: {
        authorization: `Bearer ${user.token}`,
        "content-type": "application/json",
      },
      payload: {
        description: "new description of rotated token",
        nice_id: entireAuthResponse.nice_id,
      },
    });
    expect(responsePUT1.statusCode).toBe(201);
    const data = responsePUT1.json().data;
    expect(data.nice_id).toBe(entireAuthResponse.nice_id);

    const rotatedToken = responsePUT1.json().data.token;
    const responsePOST2 = await server.inject({
      method: "POST",
      url: `/api/v${apiVersion}/sensors/${sensor.id}/records`,
      headers: {
        authorization: `Bearer ${rotatedToken}`,
        "content-type": "application/json",
      },
      payload: httpPayload,
    });
    expect(responsePOST2.statusCode).toBe(201);

    await deleteUser(user.token);
  });
});
