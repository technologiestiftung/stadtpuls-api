import { FastifyRequest } from "fastify";

export function buildRequest(
  overrides?: Record<string, unknown>
): FastifyRequest {
  const req: unknown = { ...overrides };
  return req as FastifyRequest;
}
