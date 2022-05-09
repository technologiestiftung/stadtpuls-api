// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import { sub } from "date-fns";
import { supabase } from "./index";
import { definitions } from "@technologiestiftung/stadtpuls-supabase-definitions";
// const binomial = require("@stdlib/random/base/binomial");

type Record = Omit<definitions["records"], "measurements"> & {
  measurements: number[];
};

function recordDataBuilder({
  sensor_id,
  num,
}: {
  sensor_id: number;
  num: number;
}): Omit<Record, "id">[] {
  const data: Omit<Record, "id">[] = [];
  for (let i = 0; i < num; i++) {
    data.push({
      recorded_at: new Date().toISOString(),
      // TODO: replace with random values
      measurements: [Math.random() * 10],
      sensor_id,
    });
  }
  return data;
}
export async function createRecords({
  sensor_id,
  numberOfRecords,
}: {
  sensor_id: number;
  numberOfRecords: number;
}): Promise<Record[]> {
  const { data, error } = await supabase
    .from("records")
    .insert(recordDataBuilder({ sensor_id, num: numberOfRecords }));
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("No data returned");
  }
  return data;
}

export async function createRecordsPayload({
  amount,
}: {
  amount: number;
}): Promise<
  {
    recorded_at: string;
    measurements: number[];
    latitude?: number;
    longitude?: number;
    altitude?: number;
  }[]
> {
  if (amount <= 0) throw new Error("amount must not be negative");
  const records = [];
  const now = new Date();
  for (let i = 0; i < amount; i++) {
    const measurements = [Math.random() * 10];
    const recorded_at = sub(now.setUTCHours(i % 24), {
      minutes: i,
    }).toISOString();
    const latitude = Math.random() * 10;
    const longitude = Math.random() * 10;
    const altitude = Math.random() * 10;
    records.push({
      recorded_at,
      measurements,
      latitude,
      longitude,
      altitude,
    });
  }

  return records;
}
