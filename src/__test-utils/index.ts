import faker from "faker";
import config from "config";
import { createClient } from "@supabase/supabase-js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fetch from "node-fetch";
import { definitions } from "../common/supabase";
import { TTNPostBody } from "../integrations/ttn";
export type Sensor = definitions["sensors"];

export const jwtSecret =
  process.env.JWT_SECRET ||
  "super-secret-jwt-token-with-at-least-32-characters-long";
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "123";
export const apiVersion = config.get("apiVersion");
export const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "123";
export const supabaseUrl = "http://localhost:8000";
export const authtokenEndpoint = `/api/v${apiVersion}/authtokens`;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const buildServerOpts = {
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger: false,
  issuer: "tsb",
};
export interface CreateTokenFullResponse {
  token: string;
  nice_id: number;
}
export interface ApiAuthResponsePayload {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
}

export interface User {
  id: string;
  aud: string;
  role: string;
  email: string;
  confirmed_at: Date;
  last_sign_in_at: Date;
  app_metadata: AppMetadata;
  user_metadata: null;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  sub: string;
  projectId: number;
  description: string;
  jti: string;
  iss: string;
  iat: number;
}

export interface AppMetadata {
  provider: string;
}

export const buildReply: (
  overrides?: Record<string, unknown>
) => FastifyReply = (overrides) => {
  const fastifyReply: unknown = {
    code: 200,
    status: jest.fn(() => fastifyReply),
    send: jest.fn(() => fastifyReply),
    ...overrides,
  };
  return fastifyReply as FastifyReply;
};

export const buildRequest: (
  overrides?: Record<string, unknown>
) => FastifyRequest = (overrides) => {
  const req: unknown = { ...overrides };
  return req as FastifyRequest;
};

interface SignupLoginResponse {
  token: string;
  id: string;
}

export const signupUser: () => Promise<{
  id: string;
  token: string;
}> = async () => {
  const { id, token } = await signup({
    anonKey: supabaseAnonKey,
    email: `${faker.random.word()}+${faker.internet.email()}`,
    password: faker.internet.password(),
    url: new URL(`${supabaseUrl}/auth/v1/signup`),
  });
  return { id, token };
};
export const signup: (options: {
  email: string;
  password: string;
  url: URL;
  anonKey: string;
}) => Promise<SignupLoginResponse> = async ({
  email,
  password,
  url,
  anonKey,
}) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    apikey: anonKey,
  };
  const body = JSON.stringify({ email, password });
  const response = await fetch(url.href, {
    method: "POST",
    headers,
    body,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (response.status === 200) {
    const json = (await response.json()) as ApiAuthResponsePayload;
    return { token: json.access_token, id: json.user.id };
  } else {
    throw new Error(await response.json());
  }
};
export const login: (options: {
  email: string;
  password: string;
  url: URL;
  anonKey: string;
}) => Promise<SignupLoginResponse> = async ({
  email,
  password,
  url,
  anonKey,
}) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    apikey: anonKey,
  };
  const body = JSON.stringify({ email, password });

  const response = await fetch(url.href, {
    method: "POST",
    headers,
    body,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (response.status === 200) {
    const json = (await response.json()) as ApiAuthResponsePayload;
    return { token: json.access_token, id: json.user.id };
  } else {
    throw new Error(await response.json());
  }
};

export const logout: (options: {
  userToken: string;
  url: URL;
  anonKey: string;
}) => Promise<boolean> = async ({ url, userToken, anonKey }) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${userToken}`,
  };

  const response = await fetch(url.href, {
    method: "POST",
    headers,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (response.status === 204) {
    return true;
  } else {
    throw new Error(await response.json());
  }
};

export const deleteUser: (userToken: string) => Promise<boolean> = async (
  userToken
) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${userToken}`,
  };

  const url = new URL(`${supabaseUrl}/rest/v1/rpc/delete_user`);
  const response = await fetch(url.href, {
    method: "POST",
    headers,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (response.status !== 200) {
    console.error(await response.json());
    throw new Error("Could not delete user");
  }
  return true;
};

/**
 *
 * @deprecated
 */
export const createProject: (options: {
  name?: string;
  userId: string;
  categoryId?: number;
}) => Promise<void> = async () => {
  return;
};

export const createSensor: (options: {
  user_id: string;
  name?: string;
  external_id?: string;
}) => Promise<definitions["sensors"]> = async ({
  user_id,
  name,
  external_id,
}) => {
  const { data: sensors, error: dError } = await supabase
    .from<definitions["sensors"]>("sensors")
    .insert([
      {
        name: name ? name : faker.random.word(),
        user_id,
        external_id,
        category_id: 1,
        latitude: parseFloat(faker.address.latitude()),
        longitude: parseFloat(faker.address.longitude()),
        altitude: faker.datatype.number({ min: 0, max: 100, precision: 0.1 }),
      },
    ]);
  if (!sensors) {
    throw dError;
  }
  return sensors[0];
};

export const createAuthToken: (opts: {
  server: FastifyInstance;
  userToken: string;
  getFullResponse?: boolean;
}) => Promise<string | CreateTokenFullResponse> = async ({
  server,
  userToken,
  getFullResponse = false,
}) => {
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
};

export const createTTNPayload: (
  overrides?: TTNPostBody | Record<string, unknown>
) => TTNPostBody = (overrides) => {
  return {
    simulated: true,
    end_device_ids: {
      application_ids: {
        application_id: "foo",
      },

      device_id: "123",
    },
    received_at: new Date().toISOString(),
    uplink_message: {
      decoded_payload: { measurements: [1, 2, 3], bytes: [1, 2, 3] },
      locations: {
        user: {
          latitude: 13,
          longitude: 52,
          altitude: 23,
          source: "SOURCE_REGISTRY",
        },
      },
    },
    ...overrides,
  };
};
