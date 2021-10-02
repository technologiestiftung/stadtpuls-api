import { Pool, PoolClient } from "pg";
import { closePool, databaseUrl, truncateTables } from "../../__test-utils";
let client: PoolClient;
const pool = new Pool({ connectionString: databaseUrl });
describe("things the schema should provide", () => {
  beforeAll(async () => {
    client = await pool.connect();
  });
  afterEach(async () => {
    await client.query(
      "TRUNCATE public.user_profiles restart identity cascade"
    );
  });
  afterAll(async () => {
    client.release();
    await pool.end();
    await closePool();
  });
  test("should have user_profiles.name case insensitive", async () => {
    await client.query(
      "INSERT INTO user_profiles (id, name) VALUES(uuid_generate_v4 (), $1)",
      ["foo"]
    );
    await expect(
      client.query(
        "INSERT INTO user_profiles (id, name) VALUES(uuid_generate_v4 (),$1)",
        ["Foo"]
      )
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });
  test("should have user_profiles.name needs more then 3 characters", async () => {
    await expect(
      client.query(
        "INSERT INTO user_profiles (id, name) VALUES(uuid_generate_v4 (),$1)",
        ["12"]
      )
    ).rejects.toThrow(
      /new row for relation "user_profiles" violates check constraint "name_length_min_3_check"/
    );
  });
  test("should not allow user_profiles.name special characters", async () => {
    await expect(
      client.query(
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
    ["12\0"],
    ["12\u0000"],
    ["12\u0001"],
    ["12\u0002"],
    ["12\u0003"],
    ["12\u0004"],
    ["🚀🚀🚀"],
    ["1🚀2"],
  ];
  test.each(table)("should not allow special characters %j", async (char) => {
    await expect(
      client.query(
        "INSERT INTO user_profiles (id, name) VALUES(uuid_generate_v4 (),$1)",
        [char]
      )
    ).rejects.toThrow(
      /new row for relation "user_profiles" violates check constraint "special_character_check"/
    );
  });
});
