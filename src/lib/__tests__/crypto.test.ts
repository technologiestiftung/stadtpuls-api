import { hash, compare } from "../crypto";
import crypto from "crypto";
import util from "util";
const randomBytes = util.promisify(crypto.randomBytes);
describe("hash", () => {
  test("should always create the same hash with the right salt", async () => {
    const salt = "456";
    const result = await hash({ token: "123", salt });
    expect(result).toMatchInlineSnapshot(`
      Object {
        "computedHash": "hewam3ZsmjnUK9EM+n+2byvUXmVjMg0qn9xj/Qpc0fAAfFVMTF2k09cTT6qerWDzq354r6YnmxAT1ub+admNJQ==",
        "digest": "RSA-SHA256",
        "iterations": 10000,
        "keylen": 64,
        "salt": "456",
      }
    `);
  });
});
describe("crypto compare", () => {
  test("should compare hashes and match", async () => {
    const { computedHash, salt } = await hash({ token: "123" });
    const actual = await compare({
      provided: "123",
      stored: computedHash,
      salt,
    });
    expect(actual).toBeTruthy();
  });
  test("should compare hashes and match and not match", async () => {
    const { computedHash, salt } = await hash({ token: "123" });
    const actual = await compare({
      provided: "123",
      stored: computedHash + "foo",
      salt,
    });
    expect(actual).not.toBeTruthy();
  });
  test("should compare very long hashes and match", async () => {
    const token = await (await randomBytes(256)).toString("base64");

    const { computedHash, salt } = await hash({ token });
    const actual = await compare({
      provided: token,
      stored: computedHash,
      salt,
    });
    expect(actual).toBeTruthy();
  });
});
