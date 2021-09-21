import faker from "faker";
import { definitions } from "../common/supabase";
import { signup } from "./signup";
import { supabaseAnonKey, supabaseUrl, supabase } from "./index";

export const signupUser: (
  name?: string,
  email?: string
) => Promise<{
  id: string;
  token: string;
  userProfile?: definitions["user_profiles"];
}> = async (name, email) => {
  const { id, token } = await signup({
    anonKey: supabaseAnonKey,
    email: email ? email : `${faker.random.word()}+${faker.internet.email()}`,
    password: faker.internet.password(),
    url: new URL(`${supabaseUrl}/auth/v1/signup`),
  });
  if (name) {
    const { data: userProfile, error } = await supabase
      .from<definitions["user_profiles"]>("user_profiles")
      .update({
        name,
      })
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      throw error;
    }
    if (userProfile === null) {
      throw new Error("User profile not found");
    }
    return { id, token, userProfile };
  }
  return { id, token };
};
