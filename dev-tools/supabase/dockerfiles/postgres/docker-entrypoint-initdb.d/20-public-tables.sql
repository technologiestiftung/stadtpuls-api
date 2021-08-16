-- -------------------------------------------------------------
-- TablePlus 3.12.6(367)
--
-- https://tableplus.com/
--
-- Database: postgres
-- Generation Time: 2021-04-21 11:21:46.9660
-- -------------------------------------------------------------
DROP TABLE IF EXISTS "public"."authtokens";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS "authtokens_niceId_seq";
-- Table Definition
CREATE TABLE "public"."authtokens" (
    "niceId" int4 NOT NULL DEFAULT nextval('"authtokens_niceId_seq"'::regclass),
    "id" text NOT NULL,
    "description" varchar(200) NOT NULL,
    "projectId" int4 NOT NULL,
    "userId" uuid NOT NULL,
    PRIMARY KEY ("id")
);
DROP TABLE IF EXISTS "public"."categories";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS categories_id_seq;
DROP TYPE IF EXISTS "public"."categoryNames";
CREATE TYPE "public"."categoryNames" AS ENUM (
    'Temperatur',
    'CO2',
    'Luftfeuchtigkeit',
    'Druck',
    'PAXCounter',
    'Lautstärke'
);
-- Table Definition
CREATE TABLE "public"."categories" (
    "id" int4 NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
    "name" "public"."categoryNames" NOT NULL,
    "description" varchar(200) NOT NULL,
    PRIMARY KEY ("id")
);
DROP TABLE IF EXISTS "public"."devices";
CREATE SEQUENCE IF NOT EXISTS devices_id_seq;
-- Table Definition
CREATE TABLE "public"."devices" (
    "id" int4 NOT NULL DEFAULT nextval('devices_id_seq'::regclass),
    "externalId" varchar(20) NOT NULL,
    "name" varchar(20),
    "projectId" int4 NOT NULL,
    "userId" uuid NOT NULL,
    PRIMARY KEY ("id")
);
DROP TABLE IF EXISTS "public"."projects";
CREATE SEQUENCE IF NOT EXISTS projects_id_seq;
DROP TYPE IF EXISTS "public"."connectionTypes";
CREATE TYPE "public"."connectionTypes" AS ENUM ('ttn', 'other');
-- Table Definition
CREATE TABLE "public"."projects" (
    "id" int4 NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
    "name" varchar(50) NOT NULL,
    "description" varchar(200),
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectype" "public"."connectionTypes" NOT NULL DEFAULT 'ttn'::"connectionTypes",
    "location" varchar(20),
    "userId" uuid NOT NULL,
    "categoryId" int4 NOT NULL,
    PRIMARY KEY ("id")
);
DROP TABLE IF EXISTS "public"."userprofiles";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.
DROP TYPE IF EXISTS "public"."Role";
CREATE TYPE "public"."Role" AS ENUM ('maker');
-- Table Definition
CREATE TABLE "public"."userprofiles" (
    "id" uuid NOT NULL,
    "name" varchar(20),
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "public"."Role" DEFAULT 'maker'::"Role",
    PRIMARY KEY ("id")
);
DROP TABLE IF EXISTS "public"."records";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS records_id_seq;
-- Table Definition
CREATE TABLE "public"."records" (
    "id" int4 NOT NULL DEFAULT nextval('records_id_seq'::regclass),
    "recordedAt" timestamptz NOT NULL,
    "measurements" _float8,
    "longitude" float4,
    "latitude" float4,
    "altitude" float4,
    "deviceId" int4 NOT NULL,
    PRIMARY KEY ("id")
);