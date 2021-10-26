import {
  buildReplyHeaders,
  buildReplyPayload,
  RangeUnit,
} from "../reply-utils";

describe("utilities to build reply payload", () => {
  test("should build response without nextpage", () => {
    const replyPayload = buildReplyPayload({
      url: "/api/v3/sensors",
      payload: [],
    });
    expect(replyPayload.nextPage).not.toBeDefined();
    expect(replyPayload.data).toHaveLength(0);
  });

  test("should build response with data", () => {
    const replyPayload = buildReplyPayload({
      url: "/api/v3/sensors",
      payload: [1, 2, 3],
    });
    expect(replyPayload.nextPage).not.toBeDefined();
    expect(replyPayload.data).toHaveLength(3);
  });

  test("should build response with data which is a single object and wrap it in an array", () => {
    const replyPayload = buildReplyPayload({
      url: "/api/v3/sensors",
      payload: { id: 1 },
    });
    expect(replyPayload.nextPage).not.toBeDefined();
    expect(Array.isArray(replyPayload.data)).toBe(true);
    expect(replyPayload.data).toHaveLength(1);
  });

  test("should build response with data empty array if payload is null or undefined", () => {
    const replyPayload = buildReplyPayload({
      url: "/api/v3/sensors",
      payload: null,
    });
    expect(replyPayload.nextPage).not.toBeDefined();
    expect(Array.isArray(replyPayload.data)).toBe(true);
    expect(replyPayload.data).toHaveLength(0);
  });

  test("should create a nextPage url", () => {
    const replyPayload = buildReplyPayload({
      url: "/api/v3/sensors",
      payload: [1],

      contentRange: {
        offset: 0,
        limit: 1000,
      },
    });

    expect(replyPayload.nextPage).toBeDefined();
    expect(replyPayload.nextPage).toBeDefined();
    expect(replyPayload.nextPage).toBe("/api/v3/sensors?offset=1&limit=1000");
  });
});

describe("utilities to build reply headers", () => {
  test("build reply headers", () => {
    const headers = buildReplyHeaders({
      count: null,
      offset: 0,
      unit: "sensor",
    });

    expect(headers).toBeDefined();
  });

  test("match value of headers", () => {
    // TODO: Are the two first examples right? (see https://httpwg.org/specs/rfc7233.html#header.content-range)
    expect(
      buildReplyHeaders({
        count: null,
        offset: 1,
        unit: "sensor",
      })["Content-Range"]
    ).toBe(`1-*/*`);

    expect(
      buildReplyHeaders({
        count: 1000,
        offset: 1,
        unit: "sensor",
      })["Content-Range"]
    ).toBe(`1-*/1000`);
    expect(
      buildReplyHeaders({
        count: 10,
        offset: 11,
        unit: "sensor",
        unitLength: 100,
      })["Content-Range"]
    ).toBe(`*/10`);
  });

  const table: [
    count: number | null,
    offset: number,
    unit: RangeUnit,
    unitLength?: number
  ][] = [
    [0, 0, "sensor", 0],
    [null, 0, "sensor", undefined],
    [0, 0, "sensor", undefined],
    [null, 0, "sensor", 999],
    [10000, 1000, "sensor", 1000],
  ];
  test.each(table)(
    "buildReplyHeaders({count:%j, offset: %j, unit: %j, unitLength: %j})",
    (count, offset, unit, unitLength) => {
      const headers = buildReplyHeaders({
        count,
        offset,
        unit,
        unitLength,
      });

      expect(headers).toBeDefined();
      expect(headers["Content-Range"]).toBeDefined();
      expect(headers["Range-Unit"]).toBeDefined();
    }
  );
});
