/* eslint-disable jest/no-hooks */
// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import {
  apiVersion,
  buildServerOpts,
  checkInbox,
  closePool,
  connectPool,
  signupUser,
  truncateTables,
} from "../../__test-utils";
import buildServer from "../server";

const signinUrl = `/api/v${apiVersion}/signin`;
describe("signin POST tests", () => {
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
  test("should be rejected due to missing body", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: signinUrl,
    });
    expect(response.statusCode).toBe(400);
  });
  test("should be rejected due to missing body property email", async () => {
    const server = buildServer(buildServerOpts);
    const response = await server.inject({
      method: "POST",
      url: signinUrl,
      payload: {},
    });
    expect(response.statusCode).toBe(400);
  });

  test("should be rejected since the email does not exists", async () => {
    const server = buildServer(buildServerOpts);
    const email = "me@email.com";
    const response = await server.inject({
      method: "POST",
      url: signinUrl,
      payload: { email },
    });
    expect(response.statusCode).toBe(404);
  });
  test("should be happy since the email exists", async () => {
    const server = buildServer(buildServerOpts);
    const name = "ff6347";
    const email = "me@email.com";
    await signupUser(name, email);

    const response = await server.inject({
      method: "POST",
      url: signinUrl,
      payload: { email },
    });
    // lets check the inbox
    const messages = await checkInbox("me");
    expect(messages).toHaveLength(1);
    expect(messages).toMatchSnapshot([
      {
        date: expect.any(String),
        from: "<info@stadtpuls.com>",
        id: expect.any(String),
        mailbox: email.split("@")[0],
        "posix-millis": expect.any(Number),
        seen: false,
        size: expect.any(Number),
        subject: "Your Magic Link",
        to: [`<${email}>`],
      },
    ]);
    expect(response.statusCode).toBe(204);
  });
});
