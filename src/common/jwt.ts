import { definitions } from "./supabase";
type Scope = definitions["auth_tokens"]["scope"];

export interface AuthToken {
  sub: string;
  description: string;
  jti: string;
  iss: string;
  scope: Scope;
  iat: number;
}
