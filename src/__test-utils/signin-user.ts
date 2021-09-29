import faker from "faker";
import { signin } from "./signin";
import { supabaseAnonKey, supabaseUrl } from "./index";

export async function signinUser(email?: string): Promise<void> {
  await signin({
    anonKey: supabaseAnonKey,
    email: email ? email : `${faker.random.word()}+${faker.internet.email()}`,
    url: new URL(`${supabaseUrl}/auth/v1/signin`),
  });
}
