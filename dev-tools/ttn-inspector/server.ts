import fastify from "fastify";
// simnple fastify server

const server = fastify({
  logger: false,
});

function decodeUplink(input: bytes) {
  console.log(input);
  const temp = (input[0] << 8) | input[1];
  console.log(temp);
  // const dezi = input.bytes[2];

  return {
    // data: {
    //   bytes: input.bytes,
    //   measurements: [temp, dezi],
    // },
    warnings: [],
    errors: [],
  };
}

server.route({
  url: "/",
  method: ["GET", "POST", "HEAD"],
  handler: async (request, _reply) => {
    console.log("headers", request.headers);
    console.log("body", JSON.stringify(request.body, null, 2));
    try {
      console.log(
        "decoded",
        decodeUplink(
          (request.body as { uplink_message: { frm_payload: any } })
            .uplink_message.frm_payload
        )
      );
    } catch (e) {
      console.log("error", e);
    }

    return {};
  },
});

server.listen(3000, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`server listening on ${address}`);
});
