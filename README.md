# Stadtpuls API

This is an fastify based API layer that is used by [technologiestiftung/stadtpuls-frontend](https://github.com/technologiestiftung/stadtpuls-frontend). It does:

* Issuing and maintaining authtokens for verified users
* Recieving POST requests from external sources (currently The Things Network ttn) posting them on the users behalf

Within this repo you also can find:

* Code for running a local version of supabase which is also used in integration tests
* Code for provisioning the database. We are experimenting with a mixture of using Prisma and SQL scripts. The workflow is not yet finally defined. 
* Code for having a small React client to test interaction with this API
* Code for running a Node.js MQTT client for further explorations

The API is build using docker and deployed to render.com

## Not Using pnpm (Since lerna Broke) Anymore

We stared out with lerna, moved to pnpm but now are back at npm. pnpm is a great tool when you want to publish a library in a monorepo but falls short when you need to build docker images. 

<!-- * To install pnpm run `npm install -g pnpm`
* To install and link all packages `pnpm multi install`
* To install a dev dependency package `pnpm add <pkg> -D`
* To learn more see https://pnpm.io/ -->
## Setting Up…


To get the project ready you need to do some tasks.

* create a supabase project
* get your service key and `postgresql://…` connection string
* add the connection string to your DATABASE_URL  in `dev-tools/stadtpuls-db/.env`
* add your service role key to `.env`
* provision the dev database
  * with prisma `cd dev-tools/stadtpuls-db/ && npx prisma db push --preview-feature` (in production you should use `prisma migrate`)
  * use the scripts `dev-tools/local-supabase/docker/postgres/docker-entrypoint-initdb.d/` to give your DB the final touches. Watch out: 00-initial-schema.sql, 01-auth-schema.sql and 20-public-tables.sql are covered by the supabase setup and prisma. You don't need these when working with the cloud. These scripts
    * create replication of users into the public users table (like mentioned in their [docs](https://supabase.io/docs/guides/auth#create-a-publicusers-table))
    * disable realtime for all non public tables (see also the link above on the why to do this)
    * enable row level security on all tables
    * create delete cascades
    * create remote procedure calls  that allow a user to delete a his account
### Using Prisma Migrate

**ACHTUNG!:** We had some issue where all permissions for the public tables where gone. This *might* be related to prisma migrate. (or might not we will have to investigate).

<!-- * To create a migration and apply it directly run `pnpx prisma migrate dev --name init`
* !DONT edit migrations that already have been applied
* To only create but not apply a migration run `pnpx prisma migrate dev --create-only`
* To apply that migration run `pnpx prisma migrate dev` again
* To deploy to production run `npx prisma migrate deploy` !Hint: this shouldn't be done on a dev machine but on ci.
* To learn more see https://www.prisma.io/docs/concepts/components/prisma-migrate -->



## Crypto On Tokens

The user can request a JWT (authtokens) and gets a token based on the jwt secret from supabase. This token gets hashed and is used as primary key for the table authtokens.

When a request over ttn, or any other integration, comes in we take the token and verify it. Then we look up if there is a token that is aimed at the project and user id encoded in the token. If we find it we can compare the hash (primary key id) against the incoming token. If they match the integration is verified and we insert records on the users behalf exists the token is valid. If does not match it was deleted or never create in the first place and is not allowed to add records.

<!-- Actually we should not remove existing but deleted tokens. We should flag them as revoked. When some one has a valid token that should have been revoked, but is still in use it might be a dead project or someone is signing his own tokens with our JWT secret. -->


