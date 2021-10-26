// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import { PostgrestResponse } from "@supabase/supabase-js";
import config from "config";
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import fp from "fastify-plugin";
import S from "fluent-json-schema";
import { definitions } from "../common/supabase";
import { logLevel, supabaseMaxRows } from "./env";
import {
  buildReplyHeaders,
  buildReplyPayload,
  ContentRange,
} from "./reply-utils";

// type Categories = definitions["categories"]["name"];
type Sensor = definitions["sensors"];
type Record = definitions["records"];

interface Querystring {
  category_id?: number;
  limit?: number;
  offset?: number;
}
interface QuerystringSensor extends Querystring {
  category_id?: number;
}
declare module "fastify" {
  // interface FastifyInstance {}
}

export interface SensorsPluginOptions {
  mount: string;
  apiVersion: string;
  endpoint: string;
}

interface GetSensorParams {
  sensorId: string;
}
interface GetRecordParams extends GetSensorParams {
  recordId: string;
}
type SensorNoUserId = Omit<Sensor, "user_id">;
const sensorSelection =
  "id, external_id, name, description, connection_type, location, longitude, latitude, altitude, category_id, icon_id, created_at";
const apiVersion = config.get("apiVersion");
const mountPoint = config.get<string>("mountPoint");

const getSensorParamsSchema = S.object()
  .id("sensors/:sensorId")
  .additionalProperties(false)
  .prop("sensorId", S.string().required().description("The id of the sensor"));

const getRecordParamsSchema = S.object()
  .id("sensors/:sensorId/records/:recordId")
  .additionalProperties(false)
  .prop("recordId", S.string().required().description("The id of the record"))
  .extend(getSensorParamsSchema);
// TODO: should go into commons eventually to be used on other routes
const getQuerySchemaDefault = S.object()
  .additionalProperties(false)
  .prop("limit", S.number().maximum(supabaseMaxRows))
  .prop("offset", S.number());

const getQuerySchemaSensors = S.object()
  .id("sensors")
  .title("getting sensors from the api")
  .additionalProperties(false)
  .prop("category_id", S.number())
  .extend(getQuerySchemaDefault);

const getQuerySchemaRecords = S.object()
  .id("records")
  .title("getting records for sensor from the api")
  .additionalProperties(false)
  .extend(getQuerySchemaDefault);

const sensorsRecordsRoutes: FastifyPluginAsync = async (fastify) => {
  const preRecordsHandler = async (
    request: FastifyRequest,
    _reply: FastifyReply
  ) => {
    const { sensorId } = request.params as GetSensorParams;
    const { data, error } = await fastify.supabase
      .from<Sensor>("sensors")
      .select("*")
      .eq("id", sensorId);
    if (error) {
      fastify.log.error(error);
      throw fastify.httpErrors.internalServerError();
    }
    if (data === null) {
      fastify.log.error(error);
      throw fastify.httpErrors.internalServerError();
    }
    if (data.length === 0) {
      throw fastify.httpErrors.notFound();
    }
  };

  //   ██████  ██▓ ███▄    █   ▄████  ██▓    ▓█████
  // ▒██    ▒ ▓██▒ ██ ▀█   █  ██▒ ▀█▒▓██▒    ▓█   ▀
  // ░ ▓██▄   ▒██▒▓██  ▀█ ██▒▒██░▄▄▄░▒██░    ▒███
  //   ▒   ██▒░██░▓██▒  ▐▌██▒░▓█  ██▓▒██░    ▒▓█  ▄
  // ▒██████▒▒░██░▒██░   ▓██░░▒▓███▀▒░██████▒░▒████▒
  // ▒ ▒▓▒ ▒ ░░▓  ░ ▒░   ▒ ▒  ░▒   ▒ ░ ▒░▓  ░░░ ▒░ ░
  // ░ ░▒  ░ ░ ▒ ░░ ░░   ░ ▒░  ░   ░ ░ ░ ▒  ░ ░ ░  ░
  // ░  ░  ░   ▒ ░   ░   ░ ░ ░ ░   ░   ░ ░      ░
  //       ░   ░           ░       ░     ░  ░   ░  ░

  //  ██▀███  ▓█████  ▄████▄   ▒█████   ██▀███  ▓█████▄
  // ▓██ ▒ ██▒▓█   ▀ ▒██▀ ▀█  ▒██▒  ██▒▓██ ▒ ██▒▒██▀ ██▌
  // ▓██ ░▄█ ▒▒███   ▒▓█    ▄ ▒██░  ██▒▓██ ░▄█ ▒░██   █▌
  // ▒██▀▀█▄  ▒▓█  ▄ ▒▓▓▄ ▄██▒▒██   ██░▒██▀▀█▄  ░▓█▄   ▌
  // ░██▓ ▒██▒░▒████▒▒ ▓███▀ ░░ ████▓▒░░██▓ ▒██▒░▒████▓
  // ░ ▒▓ ░▒▓░░░ ▒░ ░░ ░▒ ▒  ░░ ▒░▒░▒░ ░ ▒▓ ░▒▓░ ▒▒▓  ▒
  //   ░▒ ░ ▒░ ░ ░  ░  ░  ▒     ░ ▒ ▒░   ░▒ ░ ▒░ ░ ▒  ▒
  //   ░░   ░    ░   ░        ░ ░ ░ ▒    ░░   ░  ░ ░  ░
  //    ░        ░  ░░ ░          ░ ░     ░        ░
  //                 ░                           ░
  fastify.route<{ Params: GetRecordParams }>({
    url: `/${mountPoint}/v${apiVersion}/sensors/:sensorId/records/:recordId`,
    schema: {
      params: getRecordParamsSchema,
      response: { response: { $ref: "get-response-default#" } },
    },
    method: ["GET", "HEAD"],
    logLevel,
    preHandler: [preRecordsHandler],
    handler: async (request, reply) => {
      const { sensorId, recordId } = request.params;

      const { data, error } = await fastify.supabase
        .from<Record>("records")
        .select("*")
        .eq("id", recordId)
        .eq("sensor_id", sensorId);
      if (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
      if (data === null) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
      if (data.length === 0) {
        throw fastify.httpErrors.notFound();
      }
      if (request.method === "HEAD") {
        const headReplyHeaders = buildReplyHeaders({
          count: 1,
          offset: 0,
          unit: "record",
        });
        return reply.status(200).headers(headReplyHeaders).send();
      }
      const replyPayload = buildReplyPayload({
        url: request.url,
        payload: data,
      });
      reply.status(200).send(replyPayload);
    },
  });
  //  ▄▄▄       ██▓     ██▓
  // ▒████▄    ▓██▒    ▓██▒
  // ▒██  ▀█▄  ▒██░    ▒██░
  // ░██▄▄▄▄██ ▒██░    ▒██░
  //  ▓█   ▓██▒░██████▒░██████▒
  //  ▒▒   ▓▒█░░ ▒░▓  ░░ ▒░▓  ░
  //   ▒   ▒▒ ░░ ░ ▒  ░░ ░ ▒  ░
  //   ░   ▒     ░ ░     ░ ░
  //       ░  ░    ░  ░    ░  ░

  //  ██▀███  ▓█████  ▄████▄   ▒█████   ██▀███  ▓█████▄   ██████
  // ▓██ ▒ ██▒▓█   ▀ ▒██▀ ▀█  ▒██▒  ██▒▓██ ▒ ██▒▒██▀ ██▌▒██    ▒
  // ▓██ ░▄█ ▒▒███   ▒▓█    ▄ ▒██░  ██▒▓██ ░▄█ ▒░██   █▌░ ▓██▄
  // ▒██▀▀█▄  ▒▓█  ▄ ▒▓▓▄ ▄██▒▒██   ██░▒██▀▀█▄  ░▓█▄   ▌  ▒   ██▒
  // ░██▓ ▒██▒░▒████▒▒ ▓███▀ ░░ ████▓▒░░██▓ ▒██▒░▒████▓ ▒██████▒▒
  // ░ ▒▓ ░▒▓░░░ ▒░ ░░ ░▒ ▒  ░░ ▒░▒░▒░ ░ ▒▓ ░▒▓░ ▒▒▓  ▒ ▒ ▒▓▒ ▒ ░
  //   ░▒ ░ ▒░ ░ ░  ░  ░  ▒     ░ ▒ ▒░   ░▒ ░ ▒░ ░ ▒  ▒ ░ ░▒  ░ ░
  //   ░░   ░    ░   ░        ░ ░ ░ ▒    ░░   ░  ░ ░  ░ ░  ░  ░
  //    ░        ░  ░░ ░          ░ ░     ░        ░          ░
  //                 ░                           ░
  fastify.route<{ Querystring: Querystring; Params: GetSensorParams }>({
    url: `/${mountPoint}/v${apiVersion}/sensors/:sensorId/records`,
    schema: {
      params: getSensorParamsSchema,
      querystring: getQuerySchemaRecords,
      response: { response: { $ref: "get-response-default#" } },
    },
    method: ["HEAD", "GET"],
    logLevel,
    preHandler: [preRecordsHandler],
    handler: async (request, reply) => {
      const { sensorId } = request.params;
      const { limit: qLimit = supabaseMaxRows, offset = 0 } = request.query;
      // get the max limit. If the user gives a limit larger
      // then the limit defined by supabase we set it to our limit
      const limit = Math.min(qLimit, supabaseMaxRows);
      // head only and return
      // we get the count for later usage now
      const { count } = await fastify.supabase
        .from<Record>("records")
        .select("*", { count: "exact", head: true })
        .eq("sensor_id", sensorId);
      if (request.method === "HEAD") {
        const headReplyHeaders = buildReplyHeaders({
          count,
          offset,
          unit: "record",
        });
        return reply.status(200).headers(headReplyHeaders).send();
      }
      // done with the head request

      const { data: records, error } = await fastify.supabase
        .from<Record>("records")
        .select("*")
        .eq("sensor_id", sensorId)
        .range(offset, offset + (limit - 1));
      // upsi. We have an error. This is from supabase
      // we cant do anything for the user
      if (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
      // hm records are null but they should not.
      // we cant do anything for the user
      if (!records) {
        fastify.log.error("records are null but should not", sensorId);
        throw fastify.httpErrors.internalServerError();
      }
      // this is for pagination in header and in payload
      const contentRange = createContentRange(count, offset, limit);
      // setup the reply headers
      const replyHeaders = buildReplyHeaders({
        count,
        offset,
        unit: "record",
        unitLength: records.length,
      });
      // setup the reply payload
      const replyPayload = buildReplyPayload({
        url: request.url,
        payload: records,
        contentRange,
      });
      // return the reply
      reply.status(200).headers(replyHeaders).send(replyPayload);
    },
  });

  //
  //   ██████  ██▓ ███▄    █   ▄████  ██▓    ▓█████
  // ▒██    ▒ ▓██▒ ██ ▀█   █  ██▒ ▀█▒▓██▒    ▓█   ▀
  // ░ ▓██▄   ▒██▒▓██  ▀█ ██▒▒██░▄▄▄░▒██░    ▒███
  //   ▒   ██▒░██░▓██▒  ▐▌██▒░▓█  ██▓▒██░    ▒▓█  ▄
  // ▒██████▒▒░██░▒██░   ▓██░░▒▓███▀▒░██████▒░▒████▒
  // ▒ ▒▓▒ ▒ ░░▓  ░ ▒░   ▒ ▒  ░▒   ▒ ░ ▒░▓  ░░░ ▒░ ░
  // ░ ░▒  ░ ░ ▒ ░░ ░░   ░ ▒░  ░   ░ ░ ░ ▒  ░ ░ ░  ░
  // ░  ░  ░   ▒ ░   ░   ░ ░ ░ ░   ░   ░ ░      ░
  //       ░   ░           ░       ░     ░  ░   ░  ░
  //   ██████ ▓█████  ███▄    █   ██████  ▒█████   ██▀███
  // ▒██    ▒ ▓█   ▀  ██ ▀█   █ ▒██    ▒ ▒██▒  ██▒▓██ ▒ ██▒
  // ░ ▓██▄   ▒███   ▓██  ▀█ ██▒░ ▓██▄   ▒██░  ██▒▓██ ░▄█ ▒
  //   ▒   ██▒▒▓█  ▄ ▓██▒  ▐▌██▒  ▒   ██▒▒██   ██░▒██▀▀█▄
  // ▒██████▒▒░▒████▒▒██░   ▓██░▒██████▒▒░ ████▓▒░░██▓ ▒██▒
  // ▒ ▒▓▒ ▒ ░░░ ▒░ ░░ ▒░   ▒ ▒ ▒ ▒▓▒ ▒ ░░ ▒░▒░▒░ ░ ▒▓ ░▒▓░
  // ░ ░▒  ░ ░ ░ ░  ░░ ░░   ░ ▒░░ ░▒  ░ ░  ░ ▒ ▒░   ░▒ ░ ▒░
  // ░  ░  ░     ░      ░   ░ ░ ░  ░  ░  ░ ░ ░ ▒    ░░   ░
  //       ░     ░  ░         ░       ░      ░ ░     ░

  fastify.route<{ Params: GetSensorParams }>({
    url: `/${mountPoint}/v${apiVersion}/sensors/:sensorId`,
    schema: {
      params: getSensorParamsSchema,
      response: { response: { $ref: "get-response-default#" } },
    },
    method: ["GET", "HEAD"],
    logLevel,
    handler: async (request, reply) => {
      const { sensorId } = request.params;
      const { data, error } = await fastify.supabase
        .from<SensorNoUserId>("sensors")
        .select(sensorSelection)
        .eq("id", sensorId);
      if (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
      if (data === null) {
        fastify.log.error(error);
        throw fastify.httpErrors.internalServerError();
      }
      if (data.length === 0) {
        throw fastify.httpErrors.notFound();
      }

      if (request.method === "HEAD") {
        const headReplyHeaders = buildReplyHeaders({
          count: 1,
          offset: 0,
          unit: "sensor",
        });
        return reply.status(200).headers(headReplyHeaders).send();
      }
      const replyPayload = buildReplyPayload({
        url: request.url,
        payload: data,
      });
      reply.status(200).send(replyPayload);
    },
  });
  //
  //
  //
  //  ▄▄▄       ██▓     ██▓
  // ▒████▄    ▓██▒    ▓██▒
  // ▒██  ▀█▄  ▒██░    ▒██░
  // ░██▄▄▄▄██ ▒██░    ▒██░
  //  ▓█   ▓██▒░██████▒░██████▒
  //  ▒▒   ▓▒█░░ ▒░▓  ░░ ▒░▓  ░
  //   ▒   ▒▒ ░░ ░ ▒  ░░ ░ ▒  ░
  //   ░   ▒     ░ ░     ░ ░
  //       ░  ░    ░  ░    ░  ░
  //   ██████ ▓█████  ███▄    █   ██████  ▒█████   ██▀███    ██████
  // ▒██    ▒ ▓█   ▀  ██ ▀█   █ ▒██    ▒ ▒██▒  ██▒▓██ ▒ ██▒▒██    ▒
  // ░ ▓██▄   ▒███   ▓██  ▀█ ██▒░ ▓██▄   ▒██░  ██▒▓██ ░▄█ ▒░ ▓██▄
  //   ▒   ██▒▒▓█  ▄ ▓██▒  ▐▌██▒  ▒   ██▒▒██   ██░▒██▀▀█▄    ▒   ██▒
  // ▒██████▒▒░▒████▒▒██░   ▓██░▒██████▒▒░ ████▓▒░░██▓ ▒██▒▒██████▒▒
  // ▒ ▒▓▒ ▒ ░░░ ▒░ ░░ ▒░   ▒ ▒ ▒ ▒▓▒ ▒ ░░ ▒░▒░▒░ ░ ▒▓ ░▒▓░▒ ▒▓▒ ▒ ░
  // ░ ░▒  ░ ░ ░ ░  ░░ ░░   ░ ▒░░ ░▒  ░ ░  ░ ▒ ▒░   ░▒ ░ ▒░░ ░▒  ░ ░
  // ░  ░  ░     ░      ░   ░ ░ ░  ░  ░  ░ ░ ░ ▒    ░░   ░ ░  ░  ░
  //       ░     ░  ░         ░       ░      ░ ░     ░           ░

  // TODO: [STADTPULS-402] API Allow sensor filtering by username

  fastify.route<{ Querystring: QuerystringSensor }>({
    url: `/${mountPoint}/v${apiVersion}/sensors/`,
    schema: {
      querystring: getQuerySchemaSensors,
      response: { response: { $ref: "get-response-default#" } },
    },
    method: ["GET", "HEAD"],
    logLevel,
    handler: async (request, reply) => {
      const {
        category_id,
        limit: qLimit = supabaseMaxRows,
        offset = 0,
      } = request.query;
      const limit = Math.min(qLimit, supabaseMaxRows);

      // get the head only and return
      const { count } = await fastify.supabase
        .from<SensorNoUserId>("sensors")
        .select(sensorSelection, { count: "exact", head: true });

      if (request.method === "HEAD") {
        const headReplyHeaders = buildReplyHeaders({
          count,
          offset,
          unit: "sensor",
        });
        return reply.status(200).headers(headReplyHeaders).send();
      }

      //Apply category filter or not
      // arguments for the range filter are the same
      const rangeArgs: [from: number, to: number] = [
        offset,
        offset + (limit - 1),
      ];
      // isolate the select function

      let pgResponse: PostgrestResponse<SensorNoUserId>;
      // if we have a category_id filter for it
      if (category_id) {
        pgResponse = await fastify.supabase
          .from<SensorNoUserId>("sensors")
          .select(sensorSelection)
          .eq("category_id", category_id)
          .range(...rangeArgs);
      } else {
        pgResponse = await fastify.supabase
          .from<SensorNoUserId>("sensors")
          .select(sensorSelection)
          .range(...rangeArgs);
      }

      // now resolve the promise
      const { data: sensors, error: sensorError } = pgResponse;

      // ups. There is an error with the requerst to supabase return 500
      if (sensorError) {
        fastify.log.error(sensorError);
        throw fastify.httpErrors.internalServerError();
      }
      // oh. There is an error in the sensors. Return 500
      if (sensors === null) {
        fastify.log.error("sensors is null but it should not");
        throw fastify.httpErrors.internalServerError();
      }
      // if we have a count that is higher then the maxRows we need to return a contentRange header and nextPage
      const contentRange = createContentRange(count, offset, limit);
      // setup the reply headers
      const replyHeaders = buildReplyHeaders({
        count,
        offset,
        unit: "sensor",
        unitLength: sensors.length,
      });
      // setup the reply payload
      const replyPayload = buildReplyPayload({
        url: request.url,
        payload: sensors,
        contentRange,
      });
      // return the reply
      reply.status(200).headers(replyHeaders).send(replyPayload);
    },
  });
};

export default fp(sensorsRecordsRoutes);
function createContentRange(
  count: number | null,
  offset: number,
  limit: number
) {
  let contentRange: ContentRange | undefined;

  if (count !== null && count > supabaseMaxRows) {
    contentRange = {
      offset,
      limit,
    };
  }
  return contentRange;
}
