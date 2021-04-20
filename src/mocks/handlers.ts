// src/mocks/handlers.js

import { rest, RestHandler } from "msw";

export const setupHandlers: (url: URL) => RestHandler[] = (url) => {
  const handlers = [
    rest.get(`${url.origin}/rest/v1/authtokens`, (req, res, ctx) => {
      console.log(req.headers);
      return res(
        ctx.status(200),
        ctx.json([
          {
            id: "$2b$10$/LKvAbv/D/8ASjrR3uAupOqHEqFN70RdSvKd6yJUhFDD.dowJn3Je",
            description: "my fancy token",
            projectId: 28,
            userId: "ede34664-574f-4558-bc42-695b184d5ccd",
            niceId: 27,
          },
        ])
      );
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
