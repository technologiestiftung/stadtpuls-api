import { faker } from "@faker-js/faker";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
const { createSigner } = require("fast-jwt");

import { FastifyInstance } from "fastify";
import {
  CreateTokenFullResponse,
  authtokenEndpoint,
  supabaseAnonKey,
  supabaseUrl,
  supabaseServiceRoleKey,
} from "./index";
import { AuthToken, jwtSignOptions } from "../common/jwt";
import { hash } from "../lib/crypto";
import { jwtSecret } from "../lib/env";

const signSync = createSigner({ key: jwtSecret });

/**
 *
 * @deprecated Use createAuthTokenNotWithAPI instead. This method uses the fastify routes itself it should test. Not a good pattern.
 *
 */
export async function createAuthToken({
  server,
  userToken,
  getFullResponse = false,
}: {
  server: FastifyInstance;
  userToken: string;
  getFullResponse?: boolean;
}): Promise<string | CreateTokenFullResponse> {
  const responseToken = await server.inject({
    method: "POST",
    url: authtokenEndpoint,
    headers: {
      authorization: `Bearer ${userToken}`,
      apikey: supabaseAnonKey,
    },
    payload: {
      description: faker.random.words(5),
    },
  });

  const resBody = JSON.parse(responseToken.body);
  return getFullResponse ? resBody.data : resBody.data.token;
}

export async function createAuthTokenNotWithAPI({
  userId,
  getFullResponse = false,
}: {
  userId: string;
  getFullResponse?: boolean;
}): Promise<string | CreateTokenFullResponse> {
  const url = `${supabaseUrl}/rest/v1/auth_tokens`;
  const payload: Omit<AuthToken, "iat" | "description" | "scope" | "iss"> = {
    sub: userId,
    // scope: "sudo",
    // description,
    jti: uuidv4(),
    // iss: issuer,
  };
  const token = signSync(payload);
  const { computedHash: hashedToken, salt } = await hash({ token });
  const body = JSON.stringify({
    id: hashedToken,
    description: faker.random.words(5),
    scope: "sudo",
    user_id: userId,
    salt,
  });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${supabaseServiceRoleKey}`,
      apikey: supabaseServiceRoleKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  // console.log("response", await response.text());
  const resBody = await response.json();
  return getFullResponse ? resBody[0] : token;
}
