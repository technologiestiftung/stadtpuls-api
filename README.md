# Stadtpuls.com API

This is an fastify based API layer that is used by [technologiestiftung/stadtpuls-frontend](https://github.com/technologiestiftung/stadtpuls-frontend). It does:

* Issuing and maintaining authtokens for verified users
* Recieving POST requests from external sources via The Things Network (TTN) and HTTP for posting them on the users behalf

Within this repo you also can find:

* Code for running a local version of supabase which is also used in integration tests
* Code for provisioning the database. We are experimenting with a mixture of using Prisma and SQL scripts. The workflow is not yet finally defined. 
* Code for having a small React client to test interaction with this API
* Code for running a Node.js MQTT client for further explorations

The API is build using docker and deployed to render.com
## Setting Up…

To get the project ready you need to do some tasks.

* create a supabase project
* get your service key and `postgresql://…` connection string
* add the connection string to your DATABASE_URL  in `dev-tools/next-iot-hub-db/.env`
* add your service role key to `.env`
* provision the dev database
  * with prisma `cd dev-tools/next-iot-hub-db/ && npx prisma db push --preview-feature` (in production you should use `prisma migrate`)
  * use the scripts `dev-tools/supabase/dockerfiles/postgres/docker-entrypoint-initdb.d/` to give your DB the final touches. Watch out: 00-initial-schema.sql, 01-auth-schema.sql and 02-storage-schema.sql are covered by supabase. You don't need these when working with the cloud. These scripts
    * create replication of users into the public users table (like mentioned in their [docs](https://supabase.io/docs/guides/auth#create-a-publicusers-table))
    * disable realtime for all non public tables (see also the link above on the why to do this)
    * enable row level security on all tables
    * create delete cascades
    * create remote procedure calls  that allow a user to delete a his account
## Crypto On Tokens

The user can request a JWT (authtokens) and gets a token based on the jwt secret from supabase. This token gets hashed and is used as primary key for the table authtokens.

When a request over TTN, HTTP, or any other integration, comes in we take the token and verify it. Then we look up if there is a token that is aimed at the project and user id encoded in the token. If we find it we can compare the hash (primary key id) against the incoming token. If they match the request is verified and we insert records on the users behalf. If does not match it was deleted or never create in the first place and is not allowed to add records.

<!-- Actually we should not remove existing but deleted tokens. We should flag them as revoked. When some one has a valid token that should have been revoked, but is still in use it might be a dead project or someone is signing his own tokens with our JWT secret. -->


## Development

You need Docker and Node.js.

To start you local copy of supabase do the following:

```bash
cd dev-tools/supabase/
cp .env.example .env
mkdir dockerfiles/postgres/pg-data
docker compose up --detach
```


When your supabase instance is running you can proceed. Test if the supabase is by running the following command. Make sure to replace `<YOUR ANON KEY>` with the anon key you can find in `dev-tools/supabase/dockerfiles/kong/kong.yml` at the bottom. The port may change based on `KONG_PORT` in `dev-tools/supabase/.env`.
```bash
curl http://localhost:8000/rest/v1/ \
  -H "apikey: <YOUR ANON KEY>"
```

To start your local copy of the API create your `.env` file in the root of the repository `cp .env.example .env` and update the values. You can find them in `dev-tools/supabase/.env` and `dev-tools/supabase/dockerfiles/kong/kong.yml`. Use the `KONG_PORT` for your `SUPABASE_URL` (`http://localhost:<KONG_PORT>`)


```bash
cp .env.example .env
nvm install
npm ci
npm run dev
```

## Making Requests

When running the API you will see all possible routes in the output of your terminal. Test if it is running by making a call to unprotected routes.

```bash
curl http://localhost:4000/ 
curl http://localhost:4000/api
curl http://localhost:4000/api/v2
```

To make calls to protected routes you will need a supabase user token (created by supabase when you signup or login). The following routes can be called with supabase user tokens:

```plain
GET	/api/v2/authtokens
POST	/api/v2/authtokens
DELETE	/api/v2/authtokens
```


The following routes need an auth token created by this API.

```plain
POST	/api/v2/integrations/ttn/v3
POST	/api/v2/devices/:deviceId/records
```

### Create an Auth Token

First you need to signup or login. 

```bash
# signup
curl --location --request POST 'http://localhost:8000/auth/v1/signup' \
--header 'apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYyNzIwODU0MCwiZXhwIjoxOTc0MzYzNzQwLCJhdWQiOiIiLCJzdWIiOiIiLCJyb2xlIjoiYW5vbiJ9.sUHErUOiKZ3nHQIxy-7jND6B80Uzf9G4NtMLmL6HXPQ' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "me@me.com",
    "password": "1234password"
}'
# or login 
curl --location --request POST 'http://localhost:8000/auth/v1/token?grant_type=password' \
--header 'apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYyNzIwODU0MCwiZXhwIjoxOTc0MzYzNzQwLCJhdWQiOiIiLCJzdWIiOiIiLCJyb2xlIjoiYW5vbiJ9.sUHErUOiKZ3nHQIxy-7jND6B80Uzf9G4NtMLmL6HXPQ' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "me@me.com",
  "password": "1234password"
}'
```

You will get an response that contains an `access_token` property. That can be used to create, get and delete our auth tokens.

```bash
# get all existing tokens
curl --location --request GET 'http://localhost:4000/api/v2/authtokens?projectId=61' \
--header 'Authorization: Bearer <YOUR SUPABASE ACCESS TOKEN>'
# create a new token
curl --location --request POST 'http://localhost:4000/api/v2/authtokens' \
--header 'Authorization: Bearer <YOUR SUPABASE ACCESS TOKEN>' \
--header 'Content-Type: application/json' \
--data-raw '{
    "projectId": 61,
    "description": "my fancy token"
}'
# delete a token
curl --location --request DELETE 'http://localhost:4000/api/v2/authtokens' \
--header 'Authorization: Bearer <YOUR SUPABASE ACCESS TOKEN>' \
--header 'Content-Type: application/json' \
--data-raw '{
"tokenId": 28,
"projectId":23
}'
```

Once you created a new token via POST you can move on to posting records.

### POST Records via HTTP

To post data via HTTP you need to optain an auth token like described above. Then you can POST data.

```bash
curl --location --request POST 'http://localhost:4000/api/v2/devices/14/records' \
--header 'Authorization: Bearer <YOUR AUTH TOKEN>' \
--header 'Content-Type: application/json' \
--data-raw '{
    "latitude": 52.483107,
    "longitude": 13.390679,
    "altitude": 30,
    "measurements": [
        1,
        2,
        3
    ]
}'
```
### POST Records via TTN

You will  need an auth token like described above. Then you can hook up your TTN device to the webhooks in https://eu1.cloud.thethings.network/console/. See our extended documentation on https://stadtpuls.com for further infos.