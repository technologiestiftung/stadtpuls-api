import { setupServer, SetupServerApi } from "msw/node";
import { setupHandlers } from "./handlers";

export const setupMSWServer: (url: URL) => SetupServerApi = (url) => {
  const handlers = setupHandlers(url);
  const server = setupServer(...handlers);
  return server;
};
