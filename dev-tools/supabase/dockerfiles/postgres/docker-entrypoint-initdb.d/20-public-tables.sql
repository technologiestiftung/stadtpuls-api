-- role
DROP TYPE IF EXISTS "public"."role";
CREATE TYPE "public"."role" AS ENUM ('maker', 'taker');
--
--
--
--
--
--
-- user profile
DROP TABLE IF EXISTS "public"."user_profiles";
CREATE TABLE "public"."user_profiles" (
    "id" uuid NOT NULL,
    "name" varchar(20) constraint name_length_min_3_check check(char_length(name) >= 3) constraint special_character_check check ("name" ~* '^[a-zA-Z0-9_-]*$') constraint name_unique UNIQUE,
    "display_name" varchar(50),
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "public"."role" DEFAULT 'maker'::"role",
    "url" varchar(100),
    "description" varchar(200),
    PRIMARY KEY ("id")
);
--
--
--
--
--
--
-- auth tokens
DROP TYPE IF EXISTS "public"."token_scope";
CREATE TYPE "public"."token_scope" AS ENUM ('sudo', 'read', 'write');
DROP TABLE IF EXISTS "public"."auth_tokens";
CREATE TABLE "public"."auth_tokens" (
    "nice_id" int4 GENERATED ALWAYS AS IDENTITY,
    "id" text NOT NULL,
    "description" varchar(200) NOT NULL,
    "scope" "public"."token_scope" NOT NULL DEFAULT 'sudo'::"token_scope",
    "user_id" uuid NOT NULL REFERENCES "public"."user_profiles" (id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);
--
--
--
--
--
-- categories
DROP TABLE IF EXISTS "public"."categories";
DROP TYPE IF EXISTS "public"."category_names";
CREATE TYPE "public"."category_names" AS ENUM (
    'Temperatur',
    'CO2',
    'Luftfeuchtigkeit',
    'Luftdruck',
    'Unit Counter',
    'Lautstärke'
);
CREATE TABLE "public"."categories" (
    "id" int4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" "public"."category_names" NOT NULL constraint category_name_unique UNIQUE,
    "description" varchar(200) NOT NULL
);
--
--
--
--
--
--
--
--
-- Sensors
DROP TYPE IF EXISTS "public"."connection_types";
CREATE TYPE "public"."connection_types" AS ENUM ('http', 'ttn', 'other');
DROP TABLE IF EXISTS "public"."sensors";
-- Table Definition
CREATE TABLE "public"."sensors" (
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" int4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "external_id" varchar(36),
    "name" varchar(50) constraint name_length_min_3_check check(char_length(name) >= 3),
    "description" varchar(200),
    "connection_type" "public"."connection_types" NOT NULL DEFAULT 'http'::"connection_types",
    "location" varchar(50),
    "longitude" float8,
    "latitude" float8,
    "altitude" float8,
    "category_id" int4 NOT NULL,
    "icon_id" int4,
    "user_id" uuid NOT NULL REFERENCES "public"."user_profiles" (id) ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "public"."records";
-- Table Definition
CREATE TABLE "public"."records" (
    "id" int4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "recorded_at" timestamptz NOT NULL,
    "measurements" _float8,
    "sensor_id" int4 NOT NULL REFERENCES "public"."sensors" (id) ON DELETE CASCADE ON UPDATE CASCADE
);