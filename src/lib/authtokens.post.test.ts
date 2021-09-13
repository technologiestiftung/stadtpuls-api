import buildServer from "./server";
import { verify } from "jsonwebtoken";
import {
  JWTPayload,
  deleteUser,
  jwtSecret,
  supabaseAnonKey,
  signupUser,
  apiVersion,
  buildServerOpts,
} from "../__test-utils";

describe("authtokens POST tests", () => {
  test("should create a new token for that users", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const response = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        description: "testing",
      },
    });
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toMatchSnapshot({
      data: { token: expect.any(String), nice_id: expect.any(Number) },
    });
    await deleteUser(user.token);
  });

  test("should get a list of tokens that match the created one for that users", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const url = `/api/v${apiVersion}/authtokens`;
    const response = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
      payload: {
        description: "testing",
      },
    });
    const getResponse = await server.inject({
      method: "GET",
      url,
      headers: {
        authorization: `Bearer ${user.token}`,
        apikey: supabaseAnonKey,
      },
    });

    const postResBody = JSON.parse(response.body);
    // const getResBody = JSON.parse(getResponse.body);
    const decodedToken = verify(
      postResBody.data.token,
      jwtSecret
    ) as JWTPayload;
    // expect(
    //   getResBody.data.every(
    //     (item: { projectId: number; description: string; niceId: number }) =>
    //       item.projectId === project.id
    //   )
    // ).toBeTruthy();
    expect(user.id).toBe(decodedToken.sub);
    expect(decodedToken.iss).toBe(buildServerOpts.issuer);
    expect(response.statusCode).toBe(201);
    expect(getResponse.statusCode).toBe(200);

    // boilerplate teardown
    await deleteUser(user.token);
  });
});
