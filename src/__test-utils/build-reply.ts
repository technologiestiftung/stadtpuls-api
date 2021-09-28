import { FastifyReply } from "fastify";

export function buildReply(overrides?: Record<string, unknown>): FastifyReply {
  const fastifyReply: unknown = {
    code: 200,
    status: jest.fn(() => fastifyReply),
    send: jest.fn(() => fastifyReply),
    ...overrides,
  };
  return fastifyReply as FastifyReply;
}
