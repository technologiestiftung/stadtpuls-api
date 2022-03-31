/* eslint-disable jest/require-top-level-describe */
import { isValidDate } from "../date-utils";
import each from "jest-each";

each([
  ["2022-12-31T12:00:00z", true],
  ["foo", false],
  [1, true],
  [100000, true],
  [new Date(), true],
  [[], false],
  [{}, false],
  [undefined, false],
  [true, true], //<-- this is wired
  [null, true], //<-- this also
]).describe("date utils tests", (input, expected) => {
  test(`returns ${expected}`, async () => {
    const actual = isValidDate(new Date(input));
    console.log(new Date(input), actual);
    expect(actual).toBe(expected);
  });
});
