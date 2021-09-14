// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

//@ts-check
import http from "k6/http";
import { check } from "k6";
export let options = {
  vus: 1,
  duration: "1m",
  iterations: 1001,
};

export default function () {
  let response = http.get("http://localhost:4000");
  check(response, { "status was 200": (r) => r.status == 200 });
}
