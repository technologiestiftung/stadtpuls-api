import faker from "@faker-js/faker";
import { signin } from "./signin";
import { supabaseAnonKey, supabaseUrl } from "./index";

export async function signinUser(
  email?: string,
  password?: string
): Promise<{ password: string; email: string }> {
  const credentials = {
    password: password ? password : faker.internet.password(),
    email: email ? email : `${faker.random.word()}+${faker.internet.email()}`,
  };
  await signin({
    anonKey: supabaseAnonKey,
    password: credentials.password,
    email: credentials.email,
    url: new URL(`${supabaseUrl}/auth/v1/token?grant_type=password`),
  });
  return credentials;
}
