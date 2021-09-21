import { FastifyRequest } from "fastify";

export const buildRequest: (
  overrides?: Record<string, unknown>
) => FastifyRequest = (overrides) => {
  const req: unknown = { ...overrides };
  return req as FastifyRequest;
};
