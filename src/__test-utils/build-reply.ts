import { FastifyReply } from "fastify";

export const buildReply: (
  overrides?: Record<string, unknown>
) => FastifyReply = (overrides) => {
  const fastifyReply: unknown = {
    code: 200,
    status: jest.fn(() => fastifyReply),
    send: jest.fn(() => fastifyReply),
    ...overrides,
  };
  return fastifyReply as FastifyReply;
};
