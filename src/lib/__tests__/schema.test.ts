import faker from "faker";
import { definitions } from "../../common/supabase";
import {
  closePool,
  connectPool,
  createSensor,
  execQuery,
  signupUser,
  supabase,
  truncateTables,
} from "../../__test-utils";

describe("things the schema should provide", () => {
  beforeAll(async () => {
    await connectPool();
  });
  afterEach(async () => {
    await truncateTables();
  });
  afterAll(async () => {
    await truncateTables();
    await closePool();
  });

  test("should return an error if external_id is not set on insert of ttn sensor", async () => {
    const user = await signupUser();

    const { data: sensors, error: sError } = await supabase
      .from<definitions["sensors"]>("sensors")
      .insert([
        {
          name: faker.random.words(2),
          user_id: user.id,
          connection_type: "ttn",
          category_id: 1,
          latitude: parseFloat(faker.address.latitude()),
          longitude: parseFloat(faker.address.longitude()),
          altitude: faker.datatype.number({ min: 0, max: 100, precision: 0.1 }),
        },
      ]);
    expect(sError).not.toBeNull();
    expect(sensors).toBeNull();
    expect(sError?.message).toMatch(
      /external_id cannot be null when connection type is ttn/
    );
  });

  test("should return an error if external_id is not set on update of http to ttn sensor", async () => {
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id, name: "snoopy" });
    const { data: sensors, error: sError } = await supabase
      .from<definitions["sensors"]>("sensors")
      .update({
        connection_type: "ttn",
      })
      .eq("id", sensor.id);
    expect(sError).not.toBeNull();
    expect(sensors).toBeNull();
    expect(sError?.message).toMatch(
      /external_id cannot be null when connection type is ttn/
    );
  });
  test("should return an error if external_id is not set on upsert of http to ttn sensor", async () => {
    const user = await signupUser();
    const sensor = await createSensor({ user_id: user.id, name: "snoopy" });
    const { data: sensors, error: sError } = await supabase
      .from<definitions["sensors"]>("sensors")
      .upsert({
        connection_type: "ttn",
      })
      .eq("id", sensor.id);
    expect(sError).not.toBeNull();
    expect(sensors).toBeNull();
    expect(sError?.message).toMatch(
      /external_id cannot be null when connection type is ttn/
    );
  });
  test("should have user_profiles.name case insensitive", async () => {
    await execQuery(
      "INSERT INTO user_profiles (id, name) VALUES(uuid_generate_v4 (), $1)",
      ["foo"]
    );
    await expect(
      execQuery(
        "INSERT INTO user_profiles (id, name) VALUES(uuid_generate_v4 (),$1)",
        ["Foo"]
      )
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });
  test("should have user_profiles.name needs more then 3 characters", async () => {
    await expect(
      execQuery(
        "INSERT INTO user_profiles (id, name) VALUES(uuid_generate_v4 (),$1)",
        ["12"]
      )
    ).rejects.toThrow(
      /new row for relation "user_profiles" violates check constraint "name_length_min_3_check"/
    );
  });
  test("should not allow user_profiles.name special characters", async () => {
    await expect(
      execQuery(
        "INSERT INTO user_profiles (id, name) VALUES(uuid_generate_v4 (),$1)",
        ["12 f"]
      )
    ).rejects.toThrow(
      /new row for relation "user_profiles" violates check constraint "special_character_check"/
    );
  });

  const table: [specialChars: string][] = [
    ["`12"],
    ["1 2"],
    ["~12"],
    ["!12"],
    ["@12"],
    ["#12"],
    ["$12"],
    ["%12"],
    ["^12"],
    ["&12"],
    ["*12"],
    ["(12"],
    [")12"],
    // ["_12"],
    ["+12"],
    ["=12"],
    ["{12"],
    ["}12"],
    ["[12"],
    ["]12"],
    ["|12"],
    ["\\12"],
    [";12"],
    [":12"],
    ["'12"],
    [">12"],
    [",12"],
    ["<12"],
    ['."12'],
    ["/12"],
    ['?"12'],
    ["   "],
    ["\t12"],
    ["\n12"],
    ["\r12"],
    ["\b12"],
    ["\f12"],
    ["\v12"],
    // ["12\0"],
    // ["12\u0000"],
    ["12\u0001"],
    ["12\u0002"],
    ["12\u0003"],
    ["12\u0004"],
    ["🚀🚀🚀"],
    ["1🚀2"],
  ];
  test.each(table)("should not allow special characters %j", async (char) => {
    await expect(
      execQuery(
        "INSERT INTO user_profiles (id, name) VALUES(uuid_generate_v4 (),$1)",
        [char]
      )
    ).rejects.toThrow(
      /new row for relation "user_profiles" violates check constraint "special_character_check"/
    );
  });
});
