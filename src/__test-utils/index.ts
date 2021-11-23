import config from "config";
import { createClient } from "@supabase/supabase-js";
import { definitions } from "../common/supabase";
import { Pool } from "pg";
export { createAuthToken } from "./create-auth-token";
export { truncateTables, closePool, connectPool, execQuery } from "./db";
export { buildReply } from "./build-reply";
export { buildRequest } from "./build-request";
export { signup } from "./signup";
export { signin } from "./signin";
export { signinUser } from "./signin-user";
export { signupUser } from "./signup-user";
export { login } from "./login";
export { logout } from "./logout";
export { deleteUser } from "./delete-user";
export { checkInbox, purgeInbox } from "./mail";
export { createTTNPayload } from "./create-ttn-payload";
export { createSensor, createSensors } from "./create-sensors";
export type Sensor = definitions["sensors"];

export const maxRows = process.env.SUPABASE_MAX_ROWS
  ? parseInt(process.env.SUPABASE_MAX_ROWS, 10)
  : 3000;

export const jwtSecret =
  process.env.JWT_SECRET ||
  "super-secret-jwt-token-with-at-least-32-characters-long";
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "123";
export const apiVersion = config.get("apiVersion");
export const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "123";
export const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:8000";
export const authtokenEndpoint = `/api/v${apiVersion}/authtokens`;
export const sensorsEndpoint = `/api/v${apiVersion}/sensors`;
export const databaseUrl = process.env.DATABASE_URL!;
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const pool = new Pool({
  connectionString: databaseUrl,
});

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

export interface SignupLoginResponse {
  token: string;
  id: string;
}
