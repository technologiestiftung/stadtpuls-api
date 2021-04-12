-- -------------------------------------------------------------
-- TablePlus 3.12.5(363)
--
-- https://tableplus.com/
--
-- Database: postgres
-- Generation Time: 2021-03-11 15:36:48.3000
-- -------------------------------------------------------------


-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS public."AccessToken_id_seq";
DROP TYPE IF EXISTS "public"."Scope";
CREATE TYPE "public"."Scope" AS ENUM ('default');

-- Table Definition
CREATE TABLE "public"."AccessToken" (
    "id" int4 NOT NULL DEFAULT nextval('public."AccessToken_id_seq"'::regclass),
    "value" text NOT NULL,
    "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope" "public"."Scope" NOT NULL DEFAULT 'default'::public."Scope",
    "usersId" uuid,
    CONSTRAINT "AccessToken_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

