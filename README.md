# next-iot-hub-api



## Using pnpm (since lerna broke)

* To install pnpm run `npm install -g pnpm`
* To install and link all packages `pnpm multi install`
* To install a dev dependency package `pnpm add <pkg> -D`
* To learn more see https://pnpm.io/

## Using Prisma migrate

* To create a migration and apply it directly run `pnpx prisma migrate dev --name init`
* !DONT edit migrations that already have been applied
* To only create but not apply a migration run `pnpx prisma migrate dev --create-only`
* To apply that migration run `pnpx prisma migrate dev` again
* To deploy to production run `npx prisma migrate deploy` !Hint: this shouldn't be done on a dev machine but on ci.
* To learn more see https://www.prisma.io/docs/concepts/components/prisma-migrate

## Setting up the database

To get the project ready you need to do some tasks.

* create a supabase project
* get your service key and `postgresql://…` connection string
* add the connection string to your DATABASE_URL  in `<rootDir>/packages/next-iot-hub-db/.env`
* add your service key to `<rootDir>/packages/next-iot-hub-api/.env`
* provision the dev database with prisma `cd packages/next-iot-hub-db/ && npx prisma db push --preview-feature`
* in production you should use `prisma migrate`
* use the script `<rootDir>/packages/next-iot-hub-db/supabase/init-db.sql` to give your DB the final touches
  * creates replication of users into the public users table (like mentioned in their [docs](https://supabase.io/docs/guides/auth#create-a-publicusers-table))
  * disables realtime for all non public tables (see also the link above on the why to do this)
  * enables row level security on all tables
  * creates delete cascades
* use the script `<rootDir>/packages/next-iot-hub-db/supabase/remote-procedure-calls.sql` to setup a function that allows to delete a user

## Crypto on tokens

The user can request a JWT (authtokens) and gets a token based on the jwt secret. This token gets hashed and is used as primary key for the table authtokens.

When a request over ttn, or any other integration, comes in we take the token and verify it with JWT. Then it gets hashed and that hash is used to look it up in the table. If it exists the token is valid. If not it was deleted or never create in the first place.

Actually we should not remove existing but deleted tokens. We should flag them as revoked. When some one has a valid token that should have been revoked, but is still in use it might be a dead project or someone is signing his own tokens with our JWT secret.


