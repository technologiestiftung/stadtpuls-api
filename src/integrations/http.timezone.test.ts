/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/no-hooks */
import buildServer from "../lib/server";
import each from "jest-each";
import {
  deleteUser,
  jwtSecret,
  supabaseServiceRoleKey,
  supabaseUrl,
  apiVersion,
  signupUser,
  createSensor,
  truncateTables,
  closePool,
  connectPool,
} from "../__test-utils";
import { createAuthToken } from "../__test-utils/create-auth-token";

const issuer = "tsb";
const buildServerOpts = {
  jwtSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  logger: false,
  issuer,
};

const httpPayload = {
  latitude: 52.483107,
  longitude: 13.390679,
  altitude: 30,
  measurements: [1, 2, 3],
};

beforeAll(async () => {
  await connectPool();
});
beforeEach(async () => {
  await truncateTables();
});
// eslint-disable-next-line jest/no-hooks
afterAll(async () => {
  await truncateTables();
  await closePool();
});
each([
  ["2022-12-31T12:00:00z", "2022-12-31T12:00:00+00:00", 201],
  ["2022-12-31T12:00:00Z", "2022-12-31T12:00:00+00:00", 201],
  ["2022-12-31T12:00:00.0Z", "2022-12-31T12:00:00+00:00", 201],
  ["2022-12-31T12:00:00.00Z", "2022-12-31T12:00:00+00:00", 201],
  ["2022-12-31T12:00:00.000Z", "2022-12-31T12:00:00+00:00", 201],
  ["2022-12-31T12:00:00-01:00", "2022-12-31T13:00:00+00:00", 201],
  ["2022-03-29T18:00:00+02:00", "2022-03-29T16:00:00+00:00", 201],
]).describe(
  "HTTP POST with recorded_at: '%s' expect response to be '%s'",
  (input, expected, statusCode) => {
    test(`returns ${expected}`, async () => {
      // start boilerplate setup test
      const server = buildServer(buildServerOpts);
      const user = await signupUser();

      const authToken = await createAuthToken({
        server,
        userToken: user.token,
      });
      const device = await createSensor({
        user_id: user.id,
      });
      // end boilerplate
      const response = await server.inject({
        method: "POST",
        url: `/api/v${apiVersion}/sensors/${device.id}/records`,
        payload: {
          ...httpPayload,
          recorded_at: input,
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      expect(response.statusCode).toBe(statusCode);
      expect(response.json().record[0].recorded_at).toBe(expected);
      // start boilerplate delete user
      await deleteUser(user.token);
      // end boilerplate
    });
  }
);
