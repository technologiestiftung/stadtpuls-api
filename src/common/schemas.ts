// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import S from "fluent-json-schema";

export const getResponseDefaultSchema = S.object()
  .id("get-response-default")
  .title("default response schema for all get requests")
  .prop(
    "200",
    S.object()
      .additionalProperties(true)
      .prop("data", S.array())
      .prop("url", S.string())
      .prop("nextPage", S.string())
  );
