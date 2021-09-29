import { PoolClient } from "pg";
import { pool } from "./index";
// TODO: [STADTPULS-408] pool is blocking test from exiting. Should be shared as global so we can have a proper teardown
let client: PoolClient;
export async function connectPool(): Promise<void> {
  client = await pool.connect();
}

export async function truncateTables(): Promise<void> {
  try {
    await client.query("TRUNCATE auth.users restart identity cascade");
    await client.query(
      "TRUNCATE public.user_profiles restart identity cascade"
    );
  } catch (error) {
    console.error("DB error while truncating", error);
    throw error;
  }
}

export async function closePool(): Promise<void> {
  try {
    client.release();
    await pool.end();
  } catch (error) {
    console.error("DB error while closing pool", error);
    throw error;
  }
}
