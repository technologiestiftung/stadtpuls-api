// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import config from "config";
import { FastifyPluginAsync } from "fastify";

import fp from "fastify-plugin";
import S from "fluent-json-schema";
import { definitions } from "../common/supabase";
import { logLevel, supabaseMaxRows } from "./env";
import { buildReplyPayload } from "./reply-utils";

type Categories = Pick<definitions["categories"], "name">;
type Sensor = definitions["sensors"];
interface Querystring {
  category?: Categories | number;
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
const apiVersion = config.get("apiVersion");
const mountPoint = config.get<string>("mountPoint");
const getQuerySchema = S.object()
  .id("/sensors")
  .title("getting sensors from the api")
  .additionalProperties(false)
  .prop("category", S.number())
  .prop("limit", S.number().maximum(supabaseMaxRows))
  .prop("offset", S.number());

const sensors: FastifyPluginAsync = async (fastify) => {
  fastify.route<{ Querystring: Querystring }>({
    url: `/${mountPoint}/v${apiVersion}/sensors`,
    schema: { querystring: getQuerySchema },
    method: ["GET", "HEAD"],
    logLevel,
    handler: async (request, reply) => {
      //TODO: Apply category filter
      const {
        category,
        limit: qLimit = supabaseMaxRows,
        offset = 0,
      } = request.query;
      const limit = Math.min(qLimit, supabaseMaxRows);

      // get the head only
      if (request.method === "HEAD") {
        return reply.status(200).send();
      }

      const {
        data: sensors,
        error: sensorError,
        count,
      } = await fastify.supabase
        .from<Sensor>("sensors")
        .select("*", { count: "exact" })
        .range(offset, offset + limit);

      if (sensorError) {
        fastify.log.error(sensorError);
        throw fastify.httpErrors.internalServerError();
      }
      if (sensors === null) {
        fastify.log.error("sensors is null but it should not");
        throw fastify.httpErrors.internalServerError();
      }
      if (count !== null && count > supabaseMaxRows) {
        // need to attach some info that there are more values to get
      }

      const replyPayload = buildReplyPayload(request.url, sensors);
      reply
        .status(200)
        .headers({
          "Range-Unit": "sensors",
          "Content-Range": `${0}-${sensors?.length}/${count}`,
        })
        .send(replyPayload);
    },
  });
};

export default fp(sensors);
