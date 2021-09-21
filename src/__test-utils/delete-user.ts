// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import fetch from "node-fetch";

import { supabaseAnonKey, supabaseUrl } from "./index";

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
