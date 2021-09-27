// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import { PostgrestResponse } from "@supabase/supabase-js";
import config from "config";
import { FastifyPluginAsync } from "fastify";

import fp from "fastify-plugin";
import S from "fluent-json-schema";
import { definitions } from "../common/supabase";
import { logLevel, supabaseMaxRows } from "./env";
import {
  buildReplyHeaders,
  buildReplyPayload,
  ContentRange,
  RangeUnit,
} from "./reply-utils";

// type Categories = definitions["categories"]["name"];
type Sensor = definitions["sensors"];
interface Querystring {
  category_id?: number;
  limit?: number;
  offset?: number;
}
declare module "fastify" {
  // interface FastifyInstance {}
}

export interface SensorsPluginOptions {
  mount: string;
  apiVersion: string;
  endpoint: string;
}
type SensorNoUserId = Omit<Sensor, "user_id">;
const apiVersion = config.get("apiVersion");
const mountPoint = config.get<string>("mountPoint");
const getQuerySchema = S.object()
  .id("/sensors")
  .title("getting sensors from the api")
  .additionalProperties(false)
  .prop("category_id", S.number())
  .prop("limit", S.number().maximum(supabaseMaxRows))
  .prop("offset", S.number());
// TODO: [STADTPULS-402] API Allow sensor filtering by username
const sensors: FastifyPluginAsync = async (fastify) => {
  fastify.route<{ Querystring: Querystring }>({
    url: `/${mountPoint}/v${apiVersion}/sensors`,
    schema: {
      querystring: getQuerySchema,
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

      const unit: RangeUnit = "sensor";
      const selection =
        "id, external_id, name, description, connection_type, location, longitude, latitude, altitude, category_id, icon_id, created_at";
      // get the head only and return
      const { count } = await fastify.supabase
        .from<SensorNoUserId>("sensors")
        .select(selection, { count: "exact", head: true });

      if (request.method === "HEAD") {
        const headReplyHeaders = buildReplyHeaders({
          count,
          offset,
          unit,
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
          .select(selection)
          .eq("category_id", category_id)
          .range(...rangeArgs);
      } else {
        pgResponse = await fastify.supabase
          .from<SensorNoUserId>("sensors")
          .select(selection)
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
      let contentRange: ContentRange | undefined;
      if (count !== null && count > supabaseMaxRows) {
        contentRange = {
          offset,
          limit,
        };
      }
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

export default fp(sensors);
