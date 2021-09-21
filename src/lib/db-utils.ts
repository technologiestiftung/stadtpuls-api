// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import { FastifyInstance } from "fastify";
import { Pool } from "pg";
import { databaseUrl } from "./env";

const pool = new Pool({ connectionString: databaseUrl });
// const client = new Client(databaseUrl);

export async function getIdByEmail(
  email: string
): Promise<{ data: { id: string | undefined } | null; error: null | Error }> {
  try {
    const client = await pool.connect();
    const {
      rows,
    } = await client.query("SELECT id from auth.users WHERE email =$1", [
      email,
    ]);
    client.release();

    if (rows.length > 0) {
      return { data: { id: rows[0].id }, error: null };
    } else {
      return { data: { id: undefined }, error: null };
    }
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function checkEmail(email: string): Promise<boolean> {
  const { data, error } = await getIdByEmail(email);
  if (error) {
    throw error;
  }
  if (data) {
    return data.id !== undefined;
  }
  return false;
}

export function closeDBPool(fastifyInstance: FastifyInstance): void {
  // either this:
  pool.end(() => {
    fastifyInstance.log.info("pool has ended");
  });
}
