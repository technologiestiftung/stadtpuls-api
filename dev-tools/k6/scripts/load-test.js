/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

//@ts-check
import http from "k6/http";
import { check } from "k6";

const apiUrl = "http://localhost:4000/api/v3";
export let options = {
  // vus: 10,
  // duration: "1m",
  // iterations: 1000,
  scenarios: {
    low: {
      executor: "per-vu-iterations",
      vus: 1,
      iterations: 1000,
      startTime: "0s",
      maxDuration: "3m",
    },
    middle: {
      executor: "per-vu-iterations",
      vus: 10,
      iterations: 100,
      maxDuration: "3m",
      startTime: "3m",
    },
    high: {
      executor: "per-vu-iterations",
      vus: 50,
      iterations: 10,
      maxDuration: "3m",
      startTime: "6m",
    },
    long: {
      executor: "per-vu-iterations",
      vus: 10,
      iterations: 1000,
      maxDuration: "10m",
      startTime: "9m",
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: false }], // http errors should be less than 1%
    // 90% of requests must finish within 400ms, 95% within 800, and 99.9% within 2s.
    http_req_duration: [
      "'p(90) < 500', 'p(95) < 800', 'p(99.9) < 2000', 'avg < 400t'",
    ],
  },
};

export default function () {
  let responseBase = http.get(apiUrl);
  if (responseBase.status === 429) {
    console.log(JSON.stringify(responseBase.status_text));
  }
  check(responseBase, { "base status was 200": (r) => r.status === 200 });

  let responseSensors = http.get(`${apiUrl}/sensors`);
  check(responseSensors, { "sensors status was 200": (r) => r.status === 200 });

  // @ts-ignore
  const json = JSON.parse(responseSensors.body);
  for (const sensor of json.data) {
    let responseRecords = http.get(`${apiUrl}/sensors/${sensor.id}/records`);
    check(responseRecords, {
      "records status was 200": (r) => r.status === 200,
    });
  }
}
