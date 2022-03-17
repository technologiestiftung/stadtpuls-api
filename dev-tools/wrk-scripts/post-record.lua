-- example HTTP POST script which demonstrates setting the
-- HTTP method, body, and adding a header

wrk.method = "POST"
wrk.body   = '{"measurements":[1,2,3]}'
wrk.headers["Content-Type"] = "application/json"
wrk.headers["Authorization"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGU4MzYyOS1lNGU2LTQ1NDgtOWMzZi1jZDhiMGE3ZjFlODQiLCJqdGkiOiJkMDg1YmQyNi1jNTM5LTRmNjctODYxMS05YzMwZGMyZGFlYWYiLCJpYXQiOjE2NDc0NDQ5ODZ9.ftiIN_k6YCIsO9ZGW87QKluWTCm2QkeCu2aviNYChGs"
