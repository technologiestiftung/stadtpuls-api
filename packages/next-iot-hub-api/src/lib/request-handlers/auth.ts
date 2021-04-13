import { FastifyRequest, FastifyReply } from "fastify";
import S from "fluent-json-schema";

export const postTokenBodySchema = S.object()
  .id("/auth")
  .title("for token generation POST")
  .prop("userId", S.number().minimum(1).required());

export const getTokenQuerySchema = S.object()
  .id("/auth?projectId=123")
  .title("verify email that has a token as query")
  .prop("projectId", S.number().required());
export const deleteTokenBodySchema = S.object()
  .id("/auth")
  .title("for token generation POST")
  .prop("userId", S.number().minimum(1).required())
  .prop("tokenId", S.number().minimum(1).required());
/**
 * POST
 * Should generate a token
 * add it hashed to the db
 * reply with it
 *
 */
export const postHandler: (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void> = async (request, reply) => {
  reply.status(201).send({
    comment: "Should do create a token",
    method: `${request.method}`,
    url: `${request.url}`,
  });
};

/**
 * GET
 * Should return tokenIds and their description
 * @deprecated
 */
export const getHandler: (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void> = async (request, reply) => {
  reply.status(200).send({
    comment: "Should return tokenIds and description",
    method: `${request.method}`,
    url: `${request.url}`,
  });
};
/**
 * DELETE
 * Should lookup the user and delete it from the db s
 * reply with it
 *
 */
export const deleteHandler: (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void> = async (request, reply) => {
  reply.status(204).send();
};
