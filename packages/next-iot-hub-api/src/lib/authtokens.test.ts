import authtokensPlugin from "./authtokens";
import fastify, { HTTPMethods } from "fastify";

describe("all routes object", () => {
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip("should create fastiy plugin and actally have some routes attached to the fastify instance", async () => {
    const server = fastify();
    const routes: { url: string; method: HTTPMethods | HTTPMethods[] }[] = [];
    server.addHook("onRoute", ({ url, method, ..._rest }) => {
      //Some code
      routes.push({ url, method });
    });
    server.register(authtokensPlugin);
    expect(routes).toMatchInlineSnapshot(`Array []`);
    server.close();
  });
});
