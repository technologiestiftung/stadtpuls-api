/* eslint-disable @typescript-eslint/ban-ts-comment */
// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { checkEmail, getIdByEmail } from "../db-utils";
import { Pool } from "pg";
jest.mock("pg", () => {
  const mQuery = jest.fn(() => ({
    rows: [{ id: 1 }],
  }));
  const mClient = {
    query: mQuery,
    release: jest.fn(),
  };
  const mPool = {
    connect: jest.fn(() => mClient),
  };
  return { Pool: jest.fn(() => mPool) };
});

const pool = new Pool();

describe("tests for db utilites", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeAll(() => {
    pool.connect();
  });
  // eslint-disable-next-line jest/no-hooks
  afterAll(async () => {
    jest.resetAllMocks();
  });
  // eslint-disable-next-line jest/no-hooks
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("db utils getIdByEmail test", async () => {
    const err = new Error("test getIdByEmail");
    const client = await pool.connect();
    client.query
      //@ts-ignore
      .mockImplementationOnce(() => {
        return {
          rows: [{ id: 1 }],
        };
      })
      .mockImplementationOnce(() => {
        return {
          rows: [],
        };
      })
      .mockImplementationOnce(() => {
        throw err;
      });

    let result = await getIdByEmail("potiential@exists.com");
    expect(result).toStrictEqual({ data: { id: 1 }, error: null });
    result = await getIdByEmail("potiential@exists.com");
    expect(result).toStrictEqual({ data: { id: undefined }, error: null });
    result = await getIdByEmail("potiential@exists.com");
    expect(result).toStrictEqual({ data: null, error: err });
    client.release();
  });

  // eslint-disable-next-line jest/no-disabled-tests
  test("db utils checkEmail test", async () => {
    // const pool = new Pool();
    const err = new Error("test checkmail");
    const client = await pool.connect();
    client.query
      //@ts-ignore
      .mockImplementationOnce(() => {
        return {
          rows: [{ id: 1 }],
        };
      })
      .mockImplementationOnce(() => {
        return {
          rows: [],
        };
      })
      .mockImplementationOnce(() => {
        throw err;
      });

    let result = await checkEmail("potiential1@exists.com");
    expect(result).toBe(true);
    result = await checkEmail("potiential2@exists.com");
    expect(result).toBe(false);

    await expect(checkEmail("potiential3@exists.com")).rejects.toThrow(
      err.message
    );
  });
});
