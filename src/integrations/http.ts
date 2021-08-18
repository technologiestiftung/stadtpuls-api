import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { compare } from "bcrypt";
import { definitions } from "../common/supabase";
import { AuthToken } from "../common/jwt";
import S from "fluent-json-schema";

declare module "fastify" {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

interface HTTPPostBody {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  measurements: number[];
}

interface HTTPPostParams {
  deviceId: string;
}

const postHTTPBodySchema = S.object()
  .id("/integration/http")
  .title("Validation for data coming in via HTTP")
  .additionalProperties(false)
  .prop("latitude", S.number().minimum(-90).maximum(90))
  .prop("longitude", S.number().minimum(-180).maximum(180))
  .prop("altitude", S.number().minimum(0).maximum(10000))
  .prop("measurements", S.array().items(S.number()).required());

const postHTTPParamsSchema = S.object()
  .id("/integration/http/params")
  .title("HTTP Params")
  .additionalProperties(false)
  .prop("deviceId", S.string().required());

const http: FastifyPluginAsync = async (fastify) => {
  fastify.route<{ Body: HTTPPostBody; Params: HTTPPostParams }>({
    url: "/api/v2/devices/:deviceId/records",
    schema: { body: postHTTPBodySchema, params: postHTTPParamsSchema },
    method: "POST",
    preHandler: fastify.auth([fastify.verifyJWT]),
    handler: async (request, reply) => {
      const decoded = (await request.jwtVerify()) as AuthToken;
      const token = request.headers.authorization?.split(" ")[1];
      const { data: authtokens, error } = await fastify.supabase
        .from<definitions["authtokens"]>("authtokens")
        .select("*")
        .eq("userId", decoded.sub)
        .eq("projectId", decoded.projectId);
      if (!authtokens || authtokens.length === 0) {
        fastify.log.warn("no token found");
        throw fastify.httpErrors.unauthorized();
      }

      if (error) {
        fastify.log.error("postgres error");
        throw fastify.httpErrors.internalServerError();
      }

      const compared = await compare(token, authtokens[0].id);
      if (!compared) {
        // this shouldn't happen since the token has to be deleted at this point
        // and should already throw an error that it wasnt founds
        fastify.log.error("using old token");
        throw fastify.httpErrors.unauthorized();
      }
      const deviceId = request.params.deviceId;
      const id = parseInt(deviceId, 10);
      if (!Number.isInteger(id)) {
        throw fastify.httpErrors.badRequest();
      }
      const { data: devices, error: deviceError } = await fastify.supabase
        .from("devices")
        .select("*")
        .eq("id", id)
        .eq("projectId", decoded.projectId)
        .eq("userId", decoded.sub);
      if (!devices || devices.length === 0) {
        throw fastify.httpErrors.notFound("device not found");
      }
      if (deviceError) {
        throw fastify.httpErrors.internalServerError(
          "device not found postgres error"
        );
      }
      const measurements = request.body.measurements;
      const latitude = request.body.latitude;
      const longitude = request.body.longitude;
      const altitude = request.body.altitude;

      const recordedAt = new Date().toISOString();
      const { data: record, error: recordError } = await fastify.supabase
        .from<definitions["records"]>("records")
        .insert([
          {
            measurements: `{${measurements.join(",")}}`,
            recordedAt: recordedAt,
            deviceId: devices[0].id,
            latitude,
            longitude,
            altitude,
          },
        ]);

      if (!record) {
        throw fastify.httpErrors.internalServerError("could not create record");
      }
      if (recordError) {
        throw fastify.httpErrors.internalServerError(
          "could not create record postgres error"
        );
      }

      reply.status(201).send({ record });
    },
  });
};

export default fp(http);
