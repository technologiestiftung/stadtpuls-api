import { TTNPostBody } from "../integrations/ttn";

export function createTTNPayload(
  overrides?: TTNPostBody | Record<string, unknown>
): TTNPostBody {
  return {
    simulated: true,
    end_device_ids: {
      application_ids: {
        application_id: "foo",
      },

      device_id: "123",
    },
    received_at: new Date().toISOString(),
    uplink_message: {
      decoded_payload: { measurements: [1, 2, 3], bytes: [1, 2, 3] },
      locations: {
        user: {
          latitude: 13,
          longitude: 52,
          altitude: 23,
          source: "SOURCE_REGISTRY",
        },
      },
    },
    ...overrides,
  };
}
