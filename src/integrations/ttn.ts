import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { definitions } from "@technologiestiftung/stadtpuls-supabase-definitions";
import { AuthToken } from "../common/jwt";
import S from "fluent-json-schema";
import config from "config";
import { logLevel } from "../lib/env";

declare module "fastify" {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface TTNPostBody {
  [key: string]: unknown;
  received_at: string;
  uplink_message: {
    f_port?: number;
    frm_payload?: string;
    decoded_payload: {
      bytes?: number[];
      measurements: number[];
    };
    rx_metadata?: [
      {
        gateway_ids?: {
          gateway_id?: string;
        };
        rssi?: number;
        channel_rssi?: number;
        snr?: number;
      }
    ];
    settings?: {
      data_rate?: {
        lora?: {
          bandwidth?: number;
          spreading_factor?: number;
        };
      };
    };
    received_at?: string;
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
    [key: string]: unknown;

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

const ttn: FastifyPluginAsync = async (fastify) => {
  fastify.route<{ Body: TTNPostBody }>({
    // TODO: [STADTPULS-516] TTN should not be mounted on its own URL
    url: `/${mountPoint}/v${apiVersion}/integrations/ttn/v3`,
    method: "POST",
    logLevel,
    schema: { body: postTTNBodySchema, headers: postTTNHeaderSchema },
    preHandler: fastify.auth([fastify.verifyJWT]),
    handler: async (request, reply) => {
      const decoded = (await request.jwtVerify()) as AuthToken;
      if (request.headers.authorization === undefined) {
        throw fastify.httpErrors.unauthorized();
      }

      const token = request.headers.authorization?.split(" ")[1];
      const authTokenExists = await fastify.checkAuthtokenExists(
        token,
        decoded.sub
      );
      if (!authTokenExists) {
        // this shouldn't happen the request comes in with an valid but
        // not existing token.
        fastify.log.error("using old/non existing token");
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
        fastify.log.error(updateError, "Error while updating lat, lon, alt");
      }
      fastify.log.info(updatedSensors, "updated lat, lon, alt");

      // console.log(
      //   new Date(received_at).toISOString().replace("T", " ").replace("Z", "")
      // );
      const { data: record, error: recordError } = await fastify.supabase
        .from<definitions["records"]>("records")
        .insert([
          {
            measurements: measurements,
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

/**
 * A birds eye view of the TTN plugin.
 * When a request comes in, it will be validated against the schema and if it is valid and it has a valid JWT token, the request will be passed on to the handler function.
 *
 * In the handler it first looks up the JWT token in the data base. If it is found, it will be verified.
 *
 * From the token we obtain the `user_id`.
 *
 * Within the payload from TTN we also have a field called `end_device_ids.device_id`. This corresponds to the `external_id` id of a TTN sensor in our DB.
 * If the user has a sensor with that `external_id` we finally have a valid request.
 *
 * From there on it is basic request handling.
 *
 * We take the `measurements` from `uplink_message.decoded_payload.measurements` and insert them into the DB as record for the sensor.
 *
 * We update the lat/lon/alt fields of the sensor based on `uplink_message.locations.user.latitude`, `uplink_message.locations.user.longitude` and `uplink_message.locations.user.altitude`.
 *
 */
export default fp(ttn);
