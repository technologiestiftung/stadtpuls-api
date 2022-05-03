// TODO: Should this file be moved to sensors-records.ts?
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { definitions } from "@technologiestiftung/stadtpuls-supabase-definitions";
import { AuthToken } from "../common/jwt";
import S from "fluent-json-schema";
import config from "config";
import { logLevel } from "../lib/env";
import { isValidDate } from "../lib/date-utils";

declare module "fastify" {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
type Record = definitions["records"];

interface RecordPayload {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  measurements: number[];
  recorded_at?: string;
}
//
//https://stackoverflow.com/a/69328045
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type RecordPayloadWithRecordedAt = WithRequired<RecordPayload, "recorded_at">;
type HTTPPostBody = RecordPayload | { records: RecordPayloadWithRecordedAt[] };

interface HTTPPostParams {
  sensorId: string;
}

const apiVersion = config.get("apiVersion");
const mountPoint = config.get<string>("mountPoint");
const recordSchema = S.object()
  .id("#record")
  .additionalProperties(true)
  .raw({
    errorMessage: {
      properties: {
        recorded_at:
          'should match format "date-time" in ISO 8601 notation with UTC offset. Should be YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss+HH:mm or YYYY-MM-DDTHH:mm:ss-HH:mm-HH:mm',
      },
    },
  })
  .prop("latitude", S.number().minimum(-90).maximum(90))
  .prop("longitude", S.number().minimum(-180).maximum(180))
  .prop("altitude", S.number().minimum(0).maximum(10000))
  .prop("recorded_at", S.string().format("date-time"))
  .prop("measurements", S.array().items(S.number()).required());

const recordsSchema = S.object()
  .additionalProperties(true)
  .prop(
    "records",
    S.array().items(
      S.object().required(["measurements", "recorded_at"]).extend(recordSchema)
    )
  );

const postHTTPBodySchema = S.object()
  .id("/integration/http")
  .title("Validation for data coming in via HTTP")
  .additionalProperties(true)
  .ifThenElse(
    S.object().prop("records", S.array()),
    recordsSchema,
    recordSchema
  );

const postHTTPParamsSchema = S.object()
  .id("/integration/http/params")
  .title("HTTP Params")
  .additionalProperties(false)
  .prop("sensorId", S.string().required());

const postHTTPHeaderSchema = S.object()
  .id("/integration/http/header")
  .title("HTTP Header")
  .additionalProperties(true)
  .oneOf([
    S.object().prop("Authorization", S.string().required()),
    S.object().prop("authorization", S.string().required()),
  ]);

const http: FastifyPluginAsync = async (fastify) => {
  fastify.route<{
    Body: HTTPPostBody;
    Params: HTTPPostParams;
  }>({
    url: `/${mountPoint}/v${apiVersion}/sensors/:sensorId/records`,
    schema: {
      body: postHTTPBodySchema,
      params: postHTTPParamsSchema,
      headers: postHTTPHeaderSchema,
    },
    method: "POST",
    logLevel,
    preHandler: fastify.auth([fastify.verifyJWT]),
    handler: async (request, reply) => {
      let isBatchUpdate = false;
      // ---------------------------------
      // TODO: [STADTPULS-474] remove duplicate code on both integrations
      const decoded = (await request.jwtVerify()) as AuthToken;
      if (request.headers.authorization === undefined) {
        throw fastify.httpErrors.unauthorized();
      }
      const token = request.headers.authorization.split(" ")[1];
      const authTokenExists = await fastify.checkAuthtokenExists(
        token,
        decoded.sub
      );

      if (!authTokenExists) {
        // this shouldn't happen the request comes in with an valid but
        // not existing token.
        fastify.log.error("using old token");
        throw fastify.httpErrors.unauthorized();
      }
      // ---------------------------------
      const sensorId = request.params.sensorId;
      const id = parseInt(sensorId, 10);
      if (!Number.isInteger(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const { data: sensors, error: sensorError } = await fastify.supabase
        .from<definitions["sensors"]>("sensors")
        .select("*")
        .eq("id", id)
        .eq("user_id", decoded.sub);
      if (!sensors || sensors.length === 0) {
        throw fastify.httpErrors.notFound("sensor not found");
      }
      if (sensorError) {
        throw fastify.httpErrors.internalServerError(
          "sensor not found postgres error"
        );
      }
      let records: Omit<Record, "id">[] = [];
      if ("records" in request.body) {
        isBatchUpdate = true;
        fastify.log.info("insert multiple records. Wont update lat lon");
        records = [
          ...request.body.records.map((record) => {
            return {
              measurements: record.measurements,
              recorded_at: record.recorded_at,
              sensor_id: sensors[0].id,
            };
          }),
        ];
      } else {
        if (!request.body.measurements) {
          throw fastify.httpErrors.badRequest(
            "body should have required property 'measurements'"
          );
        }
        const measurements = request.body.measurements;
        const latitude = request.body.latitude;
        const longitude = request.body.longitude;
        const altitude = request.body.altitude;
        const recorded_at_string = request.body.recorded_at;
        let recorded_at: string | undefined;
        if (recorded_at_string !== undefined) {
          // const parsedDate = parseISO(recorded_at_string);
          if (!isValidDate(new Date(recorded_at_string))) {
            throw fastify.httpErrors.badRequest(
              "recorded_at should match format 'date-time' in ISO 8601 notation with UTC offset. Should be YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss+HH:mm or YYYY-MM-DDTHH:mm:ss-HH:mm-HH:mm"
            );
          }
          recorded_at = new Date(recorded_at_string).toISOString();
        } else {
          recorded_at = new Date().toISOString();
        }
        records = [
          {
            measurements,
            recorded_at,
            sensor_id: sensors[0].id,
          },
        ];
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
      }

      const { data, error: recordError } = await fastify.supabase
        .from<Record>("records")
        .insert(records);

      if (!records) {
        throw fastify.httpErrors.internalServerError("could not create record");
      }
      if (recordError) {
        throw fastify.httpErrors.internalServerError(
          "could not create record postgres error"
        );
      }

      reply
        .status(201)
        .send(isBatchUpdate ? { records: data } : { record: data });
    },
  });
};

export default fp(http);
