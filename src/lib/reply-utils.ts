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
interface ContentRange {
  offset: number;
  limit: number;
  totalCount: number;
}
export function buildReplyPayload<PayloadType>(
  url: string,
  payload: PayloadType,
  contentRange?: ContentRange
): ReplyPayload<PayloadType> {
  let nextPage: string | undefined = undefined;

  if (contentRange) {
    nextPage = `${url}?offset=${
      contentRange.offset + contentRange.limit
    }&limit=${contentRange.limit}`;
  }
  const empty: PayloadType[] = [];
  return {
    nextPage,
    url,
    data: payload ? payload : empty,
  };
}
