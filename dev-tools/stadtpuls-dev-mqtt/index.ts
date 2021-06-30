import * as mqtt from "mqtt";
const broker = process.env.MQTT_PUBLIC_ADDRESS;
const username = process.env.MQTT_USER;
const password = process.env.MQTT_APIKEY;
const client = mqtt.connect(`mqtt://${broker}`, { username, password });
const buff = Buffer.from(
  JSON.stringify({
    payload_fields: {
      led: true,
    },
  })
);
client.on("connect", function () {
  console.log("Connected");

  setInterval(() => {
    console.log("publish");

    client.publish(`v3/${username}/devices/bobby-digital/up`, buff);
  }, 5000);
  // client.subscribe("presence", function (err) {
  //   if (!err) {
  //     client.publish("presence", "Hello mqtt");
  //   }
  // });
});

// client.on("message", function (topic, message) {
//   // message is Buffer
//   console.log(message.toString());
//   client.end();
// });
