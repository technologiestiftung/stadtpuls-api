// src/mocks/handlers.js

import { rest, RestHandler } from "msw";

export const setupHandlers: (url: URL) => RestHandler[] = (url) => {
  const handlers = [
    rest.get(`${url.origin}/foo`, (req, res, ctx) => {
      return res(ctx.status(200), ctx.json({}));
    }),
    // rest.get(`${url.href}/api/v2/authtokens`, (req, res, ctx) => {
    //   // Persist user's authentication in the session

    //   return res(
    //     // Respond with a 200 status code

    //     ctx.status(200)
    //   );
    // }),
    // rest.post(`${url.origin}/api/v2/authtokens`, (req, res, ctx) => {
    //   // Persist user's authentication in the session

    //   return res(
    //     // Respond with a 200 status code

    //     ctx.status(200)
    //   );
    // }),
  ];
  return handlers;
};
