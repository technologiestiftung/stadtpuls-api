import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { compare } from "bcrypt";
import { definitions } from "../common/supabase";
import { AuthToken } from "../common/jwt";
import S from "fluent-json-schema";
import config from "config";

declare module "fastify" {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface TTNPostBody {
  [key: string]: unknown;
  received_at: string;
  uplink_message: {
    decoded_payload: {
      bytes: number[];
      measurements: number[];
    };
    locations?: {
      user?: {
        latitude: number;
        longitude: number;
        altitude?: number;
        source: "SOURCE_REGISTRY" | string;
      };
    };
  };
  end_device_ids: {
    device_id: string;
    application_ids: {
      application_id: string;
    };
  };
  simulated: boolean;
}
const apiVersion = config.get<number>("apiVersion");
const mountPoint = config.get<string>("mountPoint");

const postTTNHeaderSchema = S.object()
  .id("/integration/zzn/header")
  .title("HTTP Header")
  .additionalProperties(true)
  .oneOf([
    S.object().prop("Authorization", S.string().required()),
    S.object().prop("authorization", S.string().required()),
  ]);
const postTTNBodySchema = S.object()
  .id("/integrations/ttn/v3")
  .title("Validation for data coming from TTN")
  .additionalProperties(true)

  .prop("end_device_ids", S.object().prop("device_id", S.string()).required())
  .required()
  .additionalProperties(true)
  .prop("received_at", S.string().format(S.FORMATS.DATE_TIME))
  .required()
  .prop(
    "uplink_message",
    S.object()
      .prop(
        "decoded_payload",
        S.object().prop("measurements", S.array().items(S.number()).required())
      )
      .required()
      .additionalProperties(true)

      .prop(
        "locations",
        S.object()
          .prop(
            "user",
            S.object()
              .prop("latitude", S.number().minimum(-90).maximum(90))
              .prop("longitude", S.number().minimum(-180).maximum(180))
          )
          .additionalProperties(true)
      )
      .additionalProperties(true)
  )
  .required()
  .additionalProperties(true);
// console.log(JSON.stringify(postTTNBodySchema.valueOf(), null, 2));

const ttn: FastifyPluginAsync = async (fastify) => {
  fastify.route<{ Body: TTNPostBody }>({
    url: `/${mountPoint}/v${apiVersion}/integrations/ttn/v3`,
    method: "POST",
    schema: { body: postTTNBodySchema, headers: postTTNHeaderSchema },
    preHandler: fastify.auth([fastify.verifyJWT]),
    handler: async (request, reply) => {
      if (request.headers.authorization === undefined) {
        throw fastify.httpErrors.unauthorized();
      }
      const decoded = (await request.jwtVerify()) as AuthToken;
      const token = request.headers.authorization?.split(" ")[1];
      const { data: authtokens, error } = await fastify.supabase
        .from<definitions["auth_tokens"]>("auth_tokens")
        .select("*")
        .eq("user_id", decoded.sub);
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
      const { end_device_ids, received_at, uplink_message } = request.body;
      const { device_id } = end_device_ids;
      const { decoded_payload, locations } = uplink_message;
      const { measurements } = decoded_payload;
      const {
        data: sensors,
        error: sensorsError,
      } = await fastify.supabase
        .from<definitions["sensors"]>("sensors")
        .select("*")
        .eq("external_id", device_id)
        .eq("user_id", decoded.sub);
      if (!sensors || sensors.length === 0) {
        throw fastify.httpErrors.notFound("device not found");
      }
      if (sensorsError) {
        throw fastify.httpErrors.internalServerError(
          "device not found postgres error"
        );
      }
      const latitude = locations?.user?.latitude;
      const longitude = locations?.user?.longitude;
      const altitude = locations?.user?.altitude;

      const {
        data: updatedSensors,
        error: updateError,
      } = await fastify.supabase
        .from<definitions["sensors"]>("sensors")
        .update({
          latitude,
          longitude,
          altitude,
        })
        .eq("id", sensors[0].id);

      if (updateError) {
        fastify.log.error("Error while updating lat, lon, alt", updateError);
      }
      fastify.log.info("updated lat, lon, alt", updatedSensors);

      // console.log(
      //   new Date(received_at).toISOString().replace("T", " ").replace("Z", "")
      // );
      const { data: record, error: recordError } = await fastify.supabase
        .from<definitions["records"]>("records")
        .insert([
          {
            measurements: `{${measurements.join(",")}}`,
            recorded_at: received_at,
            sensor_id: sensors[0].id,
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

export default fp(ttn);
