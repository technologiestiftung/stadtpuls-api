import { definitions } from "@technologiestiftung/stadtpuls-supabase-definitions";
import { supabase } from "./index";
import { Pool } from "pg";
import { databaseUrl } from "../lib/env";

const pool = new Pool({ connectionString: databaseUrl });

export async function createSensor({
  user_id,
  name,
  external_id,
}: {
  user_id: string;
  name?: string;
  external_id?: string;
}): Promise<definitions["sensors"]> {
  const { data: sensors, error: dError } = await supabase
    .from<definitions["sensors"]>("sensors")
    .insert([
      {
        name: name ? name : faker.random.words(2),
        user_id,
        external_id,
        connection_type: external_id ? "ttn" : "http",
        category_id: 1,
        latitude: parseFloat(faker.address.latitude()),
        longitude: parseFloat(faker.address.longitude()),
        altitude: faker.datatype.number({ min: 0, max: 100, precision: 0.1 }),
      },
    ]);
  if (!sensors) {
    throw dError;
  }
  return sensors[0];
}

export async function createSensors(
  user_id: string,
  number_of_sensors: number
): Promise<definitions["sensors"][]> {
  try {
    const client = await pool.connect();
    await client.query<
      definitions["sensors"],
      [user_id: string, number_of_sensors: number]
    >(
      `insert into sensors (user_id, category_id) select $1, 1 from generate_series(1, $2) as gen (id);`,
      [user_id, number_of_sensors]
    );
    const { rows } = await client.query<definitions["sensors"]>(
      " select * from sensors;"
    );
    return rows;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
