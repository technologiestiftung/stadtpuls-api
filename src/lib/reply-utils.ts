// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export interface ReplyPayload<Payload> {
  comment?: string;
  url: string;
  data: Payload | Payload[];
  nextPage?: string;
}
export interface ContentRange {
  offset: number;
  limit: number;
}
export interface BuildReplyHeadersOptions {
  count: number | null;
  offset: number;
  unit: RangeUnit;
  unitLength?: number;
}
export type RangeUnit = "sensor" | "record";
export function buildReplyPayload<PayloadType>({
  url,
  payload,
  contentRange,
}: {
  url: string;
  payload: PayloadType;
  contentRange?: ContentRange;
}): ReplyPayload<PayloadType> {
  // TODO: This function needs to be smarter and should compare unitLength and payload
  let nextPage: string | undefined = undefined;

  if (contentRange && payload && Array.isArray(payload) && payload.length > 0) {
    const { offset, limit } = contentRange;
    nextPage = `${url}?offset=${offset + payload.length}&limit=${limit}`;
  }
  let data: PayloadType[] = [];
  if (payload && Array.isArray(payload)) {
    data = [...payload];
  } else {
    data.push(payload);
  }
  const empty: PayloadType[] = [];
  return {
    nextPage,
    url,
    data: payload ? data : empty,
  };
}

export function buildReplyHeaders({
  offset,
  unit,

  unitLength,
  count,
}: BuildReplyHeadersOptions): {
  "Range-Unit": RangeUnit;
  "Content-Range": string;
} {
  let range = unitLength
    ? `${offset}-${offset + unitLength - 1}`
    : `${offset}-*`;

  let total = count ? `${count}` : "*";

  if (unitLength !== undefined && count !== null) {
    if (offset > count) {
      range = "*";
    }
    if (unitLength < count) {
      total = "*";
    }
  }

  return {
    "Range-Unit": unit,
    "Content-Range": `${range}/${total}`,
  };
}
