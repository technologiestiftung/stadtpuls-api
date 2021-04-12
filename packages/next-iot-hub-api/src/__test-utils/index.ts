import { FastifyReply, FastifyRequest } from "fastify";

export const buildReply: (overrides?: Record<string, any>) => FastifyReply = (
  overrides
) => {
  const fastifyReply: unknown = {
    code: 200,
    status: jest.fn(() => fastifyReply),
    send: jest.fn(() => fastifyReply),
    ...overrides,
  };
  return fastifyReply as FastifyReply;
};

export const buildRequest: (
  overrides?: Record<string, any>
) => FastifyRequest = (overrides) => {
  const req: unknown = { ...overrides };
  return req as FastifyRequest;
};
