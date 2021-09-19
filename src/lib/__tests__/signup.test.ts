// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import faker from "faker";
import {
  apiVersion,
  buildServerOpts,
  deleteUser,
  signupUser,
} from "../../__test-utils";
import buildServer from "../server";

const signupUrl = `/api/v${apiVersion}/signup`;
describe("signup POST tests", () => {
  test("should be rejected due to missing body", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: signupUrl,
    });
    expect(response.statusCode).toBe(400);
  });
  test("should be rejected due to missing body property email", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: signupUrl,
      payload: {
        user: "baz",
      },
    });
    expect(response.statusCode).toBe(400);
  });
  test("should be rejected due to missing body property user", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: signupUrl,
      payload: {
        email: faker.internet.email(),
      },
    });
    expect(response.statusCode).toBe(400);
  });
  test("should be rejected due to username already taken", async () => {
    const server = buildServer(buildServerOpts);
    const { token, id, userProfile } = await signupUser("ff6347");
    // if (!userProfile) throw new Error("Could not create userProfile");

    const response = await server.inject({
      method: "POST",
      url: signupUrl,
      payload: {
        email: faker.internet.email(),
        name: userProfile?.name || "ff6347", //?
      },
    });

    expect(response.statusCode).toBe(409);
    await deleteUser(token);
  });
});
