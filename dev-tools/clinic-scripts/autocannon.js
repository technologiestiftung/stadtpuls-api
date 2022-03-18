/* eslint-disable @typescript-eslint/no-var-requires */
// autocannon --method POST --body '{"measurements":[1,2,3]}' --headers "Authorization=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGU4MzYyOS1lNGU2LTQ1NDgtOWMzZi1jZDhiMGE3ZjFlODQiLCJqdGkiOiJkMDg1YmQyNi1jNTM5LTRmNjctODYxMS05YzMwZGMyZGFlYWYiLCJpYXQiOjE2NDc0NDQ5ODZ9.ftiIN_k6YCIsO9ZGW87QKluWTCm2QkeCu2aviNYChGs" --headers "content-type: application/json" localhost:$PORT/api/v3/sensors/2/records

const autocannon = require("autocannon");
// async/await
async function main() {
  const result = await autocannon({
    url: "http://localhost:4000/api/v3/sensors/2/records",
    method: "POST",
    connections: 10, //default
    pipelining: 1, // default
    duration: 10, // default
    body: '{"measurements":[1,2,3]}',
    headers: {
      "content-type": "application/json",
      authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGU4MzYyOS1lNGU2LTQ1NDgtOWMzZi1jZDhiMGE3ZjFlODQiLCJqdGkiOiJkMDg1YmQyNi1jNTM5LTRmNjctODYxMS05YzMwZGMyZGFlYWYiLCJpYXQiOjE2NDc0NDQ5ODZ9.ftiIN_k6YCIsO9ZGW87QKluWTCm2QkeCu2aviNYChGs",
    },
  });
  // autocannon.printResult(result);
  console.log(result);
}

main().catch(console.error);
