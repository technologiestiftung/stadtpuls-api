import fs from "fs";
import path from "path";
const swaggerToTS = require("openapi-typescript").default;

import https from "https";
const anonKey = process.env.SUPABASE_ANON_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
let spec = "";
const url = new URL(`${supabaseUrl}/rest/v1/?apikey=${anonKey}`);
// const options = {
//   hostname: url.host,
//   port: 443,
//   path: url.pathname,
//   method: "GET",
// };
const req = https.request(url, (res) => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on("data", (d) => {
    // process.stdout.write(d);
    spec += d;
  });
  res.on("end", () => {
    // console.log(spec);

    const input = JSON.parse(spec); // Input can be any JS object (OpenAPI format)
    const output = swaggerToTS(input); // Outputs TypeScript defs as a string (to be parsed, or written to a file)
    // console.log(output);
    fs.writeFile(
      path.resolve(process.cwd(), "./src/common/supabase.ts"),
      output,
      "utf8",
      (err) => {
        if (err) throw err;
      }
    );
  });
});

req.on("error", (error) => {
  console.error(error);
});

req.end();
