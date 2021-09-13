import nock from "nock";

import {
  authtokenEndpoint,
  buildServerOpts,
  deleteUser,
  signupUser,
} from "../__test-utils";
import { buildServer } from "./server";

describe("error handling", () => {
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
