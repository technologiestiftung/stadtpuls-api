import { faker } from "@faker-js/faker";
import { definitions } from "@technologiestiftung/stadtpuls-supabase-definitions";
import { signup } from "./signup";
import { supabaseAnonKey, supabaseUrl, supabase } from "./index";

type UserProfile = definitions["user_profiles"];
export async function signupUser(
  name?: string,
  email?: string
): Promise<{
  id: string;
  token: string;
  userProfile?: UserProfile;
}> {
  const { id, token } = await signup({
    anonKey: supabaseAnonKey,
    email: email ? email : `${faker.internet.email()}`,
    password: faker.internet.password(),
    url: new URL(`${supabaseUrl}/auth/v1/signup`),
  });
  if (name) {
    const { data: userProfile, error } = await supabase
      .from<UserProfile>("user_profiles")
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
}
