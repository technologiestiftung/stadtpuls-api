![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

# Stadtpuls.com API

This is an fastify based API layer that is used by [technologiestiftung/stadtpuls-frontend](https://github.com/technologiestiftung/stadtpuls-frontend). It does:

- Issuing and maintaining authtokens for verified users
- Recieving POST requests from external sources via The Things Network (TTN) and HTTP for posting them on the users behalf
- Recieving GET requests from users to provide access to sensors and their records
- Wrap supabases signup and login functionality to allow users to provide a username on signup

Within this repo you also can find:

- Code for running a local version of supabase which is also used in integration tests
- Code for provisioning the database. We are SQL scripts only. The workflow is not yet finally defined. There is no fixed way of doing schema migrations yet. Possible tools could be [dbmate](https://github.com/amacneil/dbmate) or once it is stable [the new supabase cli](https://github.com/supabase/cli/tree/new)
- Code for having a small React client to test interaction with this API
- Code for running a Node.js MQTT client for further explorations

The API is deployed using docker on render.com

## Setting Up…

To get the project ready you need to do some tasks.

- Create a supabase project
- Get your service key and `postgresql://…` connection string
- Add your service role key to `.env`
- Provision the dev database
  - use the scripts `stadtpuls-supabase/supabase-docker-compose/dockerfiles/postgres/docker-entrypoint-initdb.d/` to give your DB the final touches. Watch out: 00-initial-schema.sql, 01-auth-schema.sql and 02-storage-schema.sql are covered by supabase. You don't need these when working with the cloud. The other SQL scripts
    - create replication of users into the public users table (like mentioned in their [docs](https://supabase.io/docs/guides/auth#create-a-publicusers-table))
    - disable realtime for all non public tables (see also the link above on the why to do this)
    - enable row level security on all tables
    - create delete cascades
    - create remote procedure calls that allow a user to delete a his account

## Crypto On Tokens

The user can request a JWT (authtokens) and gets a token based on the jwt secret from supabase. This token gets hashed and is used as primary key for the table authtokens. WARNING: This token can also be used to access the supabase API. If you don't want that you need to use a different secret for the signing of the authtokens in `src/lib/authtokens.ts`. This also needs some refactoring of the usage of jwt.sign which currently uses the fastify-jwt plugin.

When a request over TTN, HTTP, or any other integration, comes in we take the token and verify it. Then we look up if there is a token that is aimed at the project and user id encoded in the token. If we find it we can compare the hash (primary key id) against the incoming token. If they match the request is verified and we insert records on the users behalf. If does not match it was deleted or never create in the first place and is not allowed to add records.

## Development

You need Docker and Node.js.

To start your local redis database run the following commands:

```bash
git clone https://github.com/technologiestiftung/stadtpuls-redis
cd stadtpuls-redis/
docker composse up --detach
```

To start you local copy of supabase run the following steps:

```bash
git clone https://github.com/technologiestiftung/stadtpuls-supabase
cd stadtpuls-supabase/supabase-docker-compose
cp .env.example .env
mkdir dockerfiles/postgres/pg-data
docker compose up --detach
```

When your supabase instance is running you can proceed. Test if the supabase is by running the following command. Make sure to replace `<YOUR ANON KEY>` with the anon key you can find in `stadtpuls-supabase/supabase-docker-compose/dockerfiles/kong/kong.yml` at the bottom. The port may change based on `KONG_PORT` in `stadtpuls-supabase/supabase-docker-compose/.env`.

```bash
curl http://localhost:8000/rest/v1/ \
  -H "apikey: <YOUR ANON KEY>"
```

To start your local copy of the API create your `.env` file in the root of the repository `cp .env.example .env` and update the values. You can find them in `stadtpuls-supabase/supabase-docker-compose/.env` and `stadtpuls-supabase/supabase-docker-compose/dockerfiles/kong/kong.yml`. Use the `KONG_PORT` for your `SUPABASE_URL` (`http://localhost:<KONG_PORT>`)

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
curl http://localhost:4000/api/v3
curl http://localhost:4000/api/v3/sensors
curl http://localhost:4000/api/v3/sensors/:sensorId/records
curl http://localhost:4000/api/v3/sensors/:sensorId/records/:recordId
```

To make calls to protected routes you will need a supabase user token (created by supabase when you signup or login). The following routes can be called with supabase user tokens:

```plain
GET	/api/v<API_VERSION>/authtokens
POST	/api/v<API_VERSION>/authtokens
DELETE	/api/v<API_VERSION>/authtokens
```

The following routes need an auth token created by this API.

```plain
POST	/api/v<API_VERSION>/integrations/ttn/v3
POST	/api/v<API_VERSION>/sensors/:sensorId/records
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

You will get an response that contains an `access_token` property. That can be used to create (POST), rotate (PUT), get (GET) and delete (DELETE) our auth tokens.

```bash
# get all existing tokens
curl --location --request GET 'http://localhost:4000/api/v3/authtokens?projectId=61' \
--header 'Authorization: Bearer <YOUR SUPABASE ACCESS TOKEN>'
# create a new token
curl --location --request POST 'http://localhost:4000/api/v3/authtokens' \
--header 'Authorization: Bearer <YOUR SUPABASE ACCESS TOKEN>' \
--header 'Content-Type: application/json' \
--data-raw '{
    "description": "my fancy token"
}'
# delete a token
curl --location --request DELETE 'http://localhost:4000/api/v3/authtokens' \
--header 'Authorization: Bearer <YOUR SUPABASE ACCESS TOKEN>' \
--header 'Content-Type: application/json' \
--data-raw '{
"tokenId": 28,
}'
```

Once you created a new token via POST you can move on to posting records.

### POST Records via HTTP

To post data via HTTP you need to optain an auth token like described above. Then you can POST data.

```bash
curl --location --request POST 'http://localhost:4000/api/v3/sensors/14/records' \
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

You will need an auth token like described above. Then you can hook up your TTN device to the webhooks in https://eu1.cloud.thethings.network/console/. See our extended documentation on https://stadtpuls.com for further infos.

## Testing

To test the API you need to run the integration tests. You can do this by running `npm test`. Make sure your local supabase is running. Currently the tests use the environment variables from `.env.test`

## Running with Docker

You can run the stadtpuls-api with docker in several ways.

1. Attaching to an already existing local subase instance.
2. Running within your supabase setup.
3. Running with a remote supabase project.

Take a look at [the hub.docker.com page](https://hub.docker.com/repository/docker/technologiestiftung/stadtpuls-api) of the image to see which tag to use. Don't use the latest tag for production.

### Attaching to an already existing local supabase instance

For attaching to the already existing instance use the following `docker-compose.yml`. You should adjust the environment variables to your needs and then run

```bash
# MacOS & Windows
docker compose up
# Linux
docker-compose up
```

```yml
version: "3"
services:
  stadtpuls-api:
    environment:
      PORT: 4000
      SUPABASE_URL: http://kong:8000
      SUPABASE_SERVICE_ROLE_KEY: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYyNzIwNzUzMiwiZXhwIjoxNjkwMjc5NTMyLCJhdWQiOiIiLCJzdWIiOiIiLCJyb2xlIjoic2VydmljZV9yb2xlIn0.hfdXFZV5PdvUdo2xK0vStb1i97GJukSkRqfwd4YIh2M
      SUPABASE_ANON_KEY: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYyNzIwODU0MCwiZXhwIjoxOTc0MzYzNzQwLCJhdWQiOiIiLCJzdWIiOiIiLCJyb2xlIjoiYW5vbiJ9.sUHErUOiKZ3nHQIxy-7jND6B80Uzf9G4NtMLmL6HXPQ
      JWT_SECRET: your-super-secret-jwt-token-with-at-least-32-characters-long
      ISSUER: stadtpuls.com
      LOG_LEVEL: info
      SUPABASE_MAX_ROWS: 1000
      DATABASE_URL: postgres://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres
    image: "technologiestiftung/stadtpuls-api:latest"
    ports:
      - "4000:4000"
networks:
  default:
    external: true
    name: supabase_default
```

### Running within your supabase setup

- Copy the whole service `stadtpuls-api` to the file `stadtpuls-supabase/supabase-docker-compose/docker-compose.yml`.
- Dont copy the network part.
- Adjust the `SUPABASE_URL` to (TBD)
- Adjust the `DATABASE_URL` to (TBD)

```bash
cd stadtpuls-supabase/supabase-docker-compose/
# if you had the whole setup already running
docker compose down && rm -rf dockerfiles/postgres/pg-data/ && mkdir dockerfiles/postgres/pg-data
# MacOS & Windows
docker compose up --build --force-recreate
# Linux
docker-compose up  --build --force-recreate
```

### Running with a remote supabase project

- Adjust the `SUPABASE_URL`
- Adjust the `DATABASE_URL`
- Adjust the `SUPABASE_SERVICE_ROLE_KEY`
- Adjust the `SUPABSE_ANON_KEY`
- Adjust the `JWT_SECRET`

You can find these values under `https://app.supabase.io/project/<YOUR PROJECT ID>/settings/api`

```bash
# MacOS & Windows
docker compose up
# Linux
docker-compose up
```

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://fabianmoronzirfas.me/"><img src="https://avatars.githubusercontent.com/u/315106?v=4?s=64" width="64px;" alt=""/><br /><sub><b>Fabian Morón Zirfas</b></sub></a><br /><a href="https://github.com/technologiestiftung/stadtpuls-api/commits?author=ff6347" title="Code">💻</a> <a href="https://github.com/technologiestiftung/stadtpuls-api/commits?author=ff6347" title="Documentation">📖</a></td>
    <td align="center"><a href="https://dnsos.info/"><img src="https://avatars.githubusercontent.com/u/15640196?v=4?s=64" width="64px;" alt=""/><br /><sub><b>Dennis Ostendorf</b></sub></a><br /><a href="https://github.com/technologiestiftung/stadtpuls-api/pulls?q=is%3Apr+reviewed-by%3Adnsos" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/technologiestiftung/stadtpuls-api/commits?author=dnsos" title="Code">💻</a> <a href="https://github.com/technologiestiftung/stadtpuls-api/commits?author=dnsos" title="Documentation">📖</a></td>
    <td align="center"><a href="https://vogelino.com/"><img src="https://avatars.githubusercontent.com/u/2759340?v=4?s=64" width="64px;" alt=""/><br /><sub><b>Lucas Vogel</b></sub></a><br /><a href="https://github.com/technologiestiftung/stadtpuls-api/pulls?q=is%3Apr+reviewed-by%3Avogelino" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/technologiestiftung/stadtpuls-api/commits?author=vogelino" title="Code">💻</a> <a href="https://github.com/technologiestiftung/stadtpuls-api/commits?author=vogelino" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/lucasoeth"><img src="https://avatars.githubusercontent.com/u/43838158?v=4?s=64" width="64px;" alt=""/><br /><sub><b>lucasoeth</b></sub></a><br /><a href="https://github.com/technologiestiftung/stadtpuls-api/commits?author=lucasoeth" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/julizet"><img src="https://avatars.githubusercontent.com/u/52455010?v=4?s=64" width="64px;" alt=""/><br /><sub><b>Julia Zet</b></sub></a><br /><a href="https://github.com/technologiestiftung/stadtpuls-api/commits?author=julizet" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Credits

<table>
  <tr>
    <td>
      <a src="https://citylab-berlin.org/de/start/">
        <br />
        <br />
        <img width="200" src="https://citylab-berlin.org/wp-content/uploads/2021/05/citylab-logo.svg" />
      </a>
    </td>
    <td>
      A project by: <a src="https://www.technologiestiftung-berlin.de/">
        <br />
        <br />
        <img width="150" src="https://citylab-berlin.org/wp-content/uploads/2021/05/tsb.svg" />
      </a>
    </td>
    <td>
      Supported by: <a src="https://www.berlin.de/rbmskzl/">
        <br />
        <br />
        <img width="80" src="https://citylab-berlin.org/wp-content/uploads/2021/12/B_RBmin_Skzl_Logo_DE_V_PT_RGB-300x200.png" />
      </a>
    </td>
  </tr>
</table>
