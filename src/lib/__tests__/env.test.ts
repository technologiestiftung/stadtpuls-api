describe("env var loading", () => {
  test("should pass since we have all the variables in place", async () => {
    const envs = await import("../env");

    expect(envs.jwtSecret).toBe(process.env.JWT_SECRET);
    expect(envs.issuer).toBe(process.env.ISSUER);
    expect(envs.supabaseUrl).toBe(process.env.SUPABASE_URL);
    expect(envs.port).toBe(parseInt(process.env.PORT!));
    expect(envs.supabaseServiceRoleKey).toBe(
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  });
});
