import faker from "faker";
import { definitions } from "../common/supabase";
import { supabase } from "./index";

export const createSensor: (options: {
  user_id: string;
  name?: string;
  external_id?: string;
}) => Promise<definitions["sensors"]> = async ({
  user_id,
  name,
  external_id,
}) => {
  const { data: sensors, error: dError } = await supabase
    .from<definitions["sensors"]>("sensors")
    .insert([
      {
        name: name ? name : faker.random.words(2),
        user_id,
        external_id,
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
};
