import fs from "fs";
import path from "path";
import openapiTS from "openapi-typescript";

const anonKey = process.env.SUPABASE_ANON_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const url = new URL(`${supabaseUrl}/rest/v1/?apikey=${anonKey}`);
// const options = {
//   hostname: url.host,
//   port: 443,
//   path: url.pathname,
//   method: "GET",
// };

async function main() {
  const output = await openapiTS(url.toString());
  fs.writeFile(
    path.resolve(process.cwd(), "./src/common/supabase.ts"),
    output,
    "utf8",
    (err) => {
      if (err) throw err;
    }
  );
}

main().catch(console.error);
// const req = http.request(url, (res) => {
//   console.log(`statusCode: ${res.statusCode}`);

//   res.on("data", (d) => {
//     // process.stdout.write(d);
//     spec += d;
//   });
//   res.on("end", () => {
//     // console.log(spec);

//     const input = JSON.parse(spec); // Input can be any JS object (OpenAPI format)
//     const output = swaggerToTS(input); // Outputs TypeScript defs as a string (to be parsed, or written to a file)
//     // console.log(output);
//     fs.writeFile(
//       path.resolve(process.cwd(), "./src/common/supabase.ts"),
//       output,
//       "utf8",
//       (err) => {
//         if (err) throw err;
//       }
//     );
//   });
// });

// req.on("error", (error) => {
//   console.error(error);
// });

// req.end();
