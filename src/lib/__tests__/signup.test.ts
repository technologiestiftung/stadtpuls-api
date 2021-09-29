/* eslint-disable jest/no-hooks */
// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import faker from "faker";
import {
  apiVersion,
  buildServerOpts,
  checkInbox,
  deleteUser,
  purgeInbox,
  signupUser,
  truncateTables,
} from "../../__test-utils";
import { closePool } from "../../__test-utils/truncate-tables";
import buildServer from "../server";

const signupUrl = `/api/v${apiVersion}/signup`;
describe("signup POST tests", () => {
  beforeEach(async () => {
    await truncateTables();
  });
  // eslint-disable-next-line jest/no-hooks
  afterAll(async () => {
    await truncateTables();
    await closePool();
  });
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
    const { token, userProfile } = await signupUser("ff6347");
    // if (!userProfile) throw new Error("Could not create userProfile");

    const response = await server.inject({
      method: "POST",
      url: signupUrl,
      payload: {
        email: faker.internet.email(),
        name: userProfile?.name,
      },
    });

    expect(response.statusCode).toBe(409);
    await deleteUser(token);
  });

  test("should be rejected due to email already taken", async () => {
    const server = buildServer(buildServerOpts);
    const name = "ff6347";
    const email = "me@email.com";
    const { token } = await signupUser(name, email);

    const response = await server.inject({
      method: "POST",
      url: signupUrl,
      payload: {
        email,
        name: faker.random.word(), //?
      },
    });
    expect(response.statusCode).toBe(409);
    await deleteUser(token);
  });

  test("should create a new user and user profile with a username", async () => {
    const server = buildServer(buildServerOpts);
    const name = "ff6347";
    const email = "me@email.com";
    await purgeInbox(email.split("@")[0]);
    const response = await server.inject({
      method: "POST",
      url: signupUrl,
      payload: {
        email,
        name,
      },
    });
    const messages = await checkInbox("me");
    expect(messages).toHaveLength(1);
    expect(messages).toMatchSnapshot([
      {
        date: expect.any(String),
        from: "<info@stadtpuls.com>",
        id: expect.any(String),
        mailbox: "me",
        "posix-millis": expect.any(Number),
        seen: false,
        size: expect.any(Number),
        subject: "Your Magic Link",
        to: ["<me@email.com>"],
      },
    ]);
    expect(response.statusCode).toBe(204);
  });
});
