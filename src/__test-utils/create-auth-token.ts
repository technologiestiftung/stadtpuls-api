import faker from "faker";
import { FastifyInstance } from "fastify";
import {
  CreateTokenFullResponse,
  authtokenEndpoint,
  supabaseAnonKey,
} from "./index";

export const createAuthToken: (opts: {
  server: FastifyInstance;
  userToken: string;
  getFullResponse?: boolean;
}) => Promise<string | CreateTokenFullResponse> = async ({
  server,
  userToken,
  getFullResponse = false,
}) => {
  const responseToken = await server.inject({
    method: "POST",
    url: authtokenEndpoint,
    headers: {
      authorization: `Bearer ${userToken}`,
      apikey: supabaseAnonKey,
    },
    payload: {
      description: faker.random.words(5),
    },
  });

  const resBody = JSON.parse(responseToken.body);
  return getFullResponse ? resBody.data : resBody.data.token;
};
