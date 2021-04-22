import { FastifyReply, FastifyRequest } from "fastify";
import fetch from "node-fetch";
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
    "Conten-Type": "application/json",
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
    "Conten-Type": "application/json",
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
    "Conten-Type": "application/json",
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

export const deleteUser: (options: {
  anonKey: string;
  userToken: string;
  url: URL;
}) => Promise<boolean> = async ({ anonKey, userToken, url }) => {
  const headers: HeadersInit = {
    "Conten-Type": "application/json",
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
  if (response.status === 200) {
    return true;
  } else {
    throw new Error(await response.json());
  }
};
