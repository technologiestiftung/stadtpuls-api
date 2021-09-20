/* eslint-disable jest/no-commented-out-tests */
/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/no-hooks */
import nock from "nock";
// import * as supabase from "@supabase/supabase-js";
import {
  authtokenEndpoint,
  buildServerOpts,
  deleteUser,
  signupUser,
  truncateTables,
} from "../../__test-utils";
import { buildServer } from "../server";
// import { PostgrestError } from "@supabase/supabase-js";
// jest.mock("@supabase/supabase-js", () => ({
//   createClient: jest.fn(),
// }));
describe("error handling", () => {
  //   afterEach(() => {
  //     jest.resetAllMocks();
  //   });
  //   afterAll(() => {
  //     jest.clearAllMocks();
  //   });
  // eslint-disable-next-line jest/no-hooks
  beforeEach(async () => {
    await truncateTables();
  });
  test("should throw an error in GET due to returned postgres error", async () => {
    const server = buildServer(buildServerOpts);
    const user = await signupUser();

    const logSpy = jest.spyOn(server.log, "error");
    // const httpErrorsSpy = jest.spyOn(server.httpErrors, "internalServerError");
    const scope = nock("http://localhost:8000")
      .get("/rest/v1/auth_tokens")
      .query(true)
      .reply(500);

    const res = await server.inject({
      method: "GET",
      url: authtokenEndpoint,
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(500);
    expect(logSpy).toHaveBeenCalledTimes(1);
    scope.done();
    nock.cleanAll();
    nock.enableNetConnect();
    jest.resetAllMocks();
    // expect(httpErrorsSpy).toHaveBeenCalledTimes(1);
    await deleteUser(user.token);
  });
});

// test.only("should mock supabase and return error", async () => {
//   const err: PostgrestError = {
//     code: "500",
//     message: "string",
//     details: "string",
//     hint: "string",
//   };
//   const postgrestResponse: any = {
//     from: jest.fn().mockRejectedValue({ error: err }),
//     select: jest.fn().mockRejectedValue({ error: err }),
//   };
//   //@ts-ignore
//   supabase.createClient.mockImplementation(() => {
//     return postgrestResponse;
//   });
//   const server = buildServer(buildServerOpts);
//   const user = await signupUser();
//   const res = await server.inject({
//     method: "GET",
//     url: authtokenEndpoint,
//     headers: { authorization: `Bearer ${user.token}` },
//   });
//   expect(res.statusCode).toBe(500);
//   expect(supabase.createClient).toHaveBeenCalledTimes(1);
//   expect(postgrestResponse.select).toHaveBeenCalledTimes(1);
//   await deleteUser(user.token);
// });
