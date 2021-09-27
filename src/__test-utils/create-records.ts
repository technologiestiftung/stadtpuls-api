// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { supabase } from "./index";
import { definitions } from "../common/supabase";

type Record = definitions["records"];

function recordDataBuilder({
  sensor_id,
  num,
}: {
  sensor_id: number;
  num: number;
}): Record[] {
  const data: Record[] = [];
  for (let i = 0; i < num; i++) {
    data.push({
      id: i,
      recorded_at: new Date().toISOString(),
      measurements: [],
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
