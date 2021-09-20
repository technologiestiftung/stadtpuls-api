import { Pool } from "pg";
import { databaseUrl } from "../lib/env";

export const pool = new Pool({
  connectionString: databaseUrl,
});
export async function truncateTables(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query("TRUNCATE auth.users restart identity cascade");
    await client.query(
      "TRUNCATE public.user_profiles restart identity cascade"
    );
    client.release();
  } catch (error) {
    console.error("DB error while truncating", error);
    throw error;
  }
}
