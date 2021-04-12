import routesPlugin from "./routes";
import fastify, { HTTPMethods } from "fastify";

describe("All routes object", () => {
  test.skip("should create fastiy plugin and actally have some routes attached to the fastify instance", async () => {
    const server = fastify();
    const routes: { url: string; method: HTTPMethods | HTTPMethods[] }[] = [];
    server.addHook("onRoute", ({ url, method, ..._rest }) => {
      //Some code
      routes.push({ url, method });
    });
    server.register(routesPlugin);
    expect(routes).toMatchInlineSnapshot(`Array []`);
    server.close();
  });
});
