import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { compare } from "bcrypt";
import { definitions } from "../common/supabase";
import { AuthToken } from "../common/jwt";
declare module "fastify" {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const ttn: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    url: "/api/v2/integrations/ttn/v3",
    method: "POST",
    preHandler: fastify.auth([fastify.verifyJWT]),
    handler: async (request, reply) => {
      const decoded = (await request.jwtVerify()) as AuthToken;
      const token = request.headers.authorization?.split(" ")[1];
      if (!token) {
        throw fastify.httpErrors.unauthorized();
      }
      const { data: authtokens, error } = await fastify.supabase
        .from<definitions["authtokens"]>("authtokens")
        .select("*")
        .eq("userId", decoded.sub)
        .eq("projectId", decoded.projectId);

      if (error) {
        throw fastify.httpErrors.internalServerError();
      }
      if (!authtokens) {
        throw fastify.httpErrors.unauthorized();
      }

      const compared = await compare(token, authtokens[0].id);
      if (!compared) {
        throw fastify.httpErrors.unauthorized();
      }
      console.log(request.body);
      reply.status(201).send({ compared });
    },
  });
};

export default fp(ttn);
