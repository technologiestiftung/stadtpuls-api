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
-- Table Definition
CREATE TABLE "public"."authtokens" (
    "niceId" int4 GENERATED ALWAYS AS IDENTITY,
    "id" text NOT NULL,
    "description" varchar(200) NOT NULL,
    "projectId" int4 NOT NULL,
    "userId" uuid NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."categories";

-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.
-- Sequence and defined type
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
    "id" int4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" "public"."categoryNames" NOT NULL,
    "description" varchar(200) NOT NULL
);

DROP TABLE IF EXISTS "public"."devices";

-- Table Definition
CREATE TABLE "public"."devices" (
    "id" int4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "externalId" varchar(36) NOT NULL,
    "name" varchar(20),
    "projectId" int4 NOT NULL,
    "userId" uuid NOT NULL
);

DROP TABLE IF EXISTS "public"."projects";

DROP TYPE IF EXISTS "public"."connectionTypes";

CREATE TYPE "public"."connectionTypes" AS ENUM ('ttn', 'other');

-- Table Definition
CREATE TABLE "public"."projects" (
    "id" int4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" varchar(50) NOT NULL,
    "description" varchar(200),
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectype" "public"."connectionTypes" NOT NULL DEFAULT 'ttn' :: "connectionTypes",
    "location" varchar(20),
    "userId" uuid NOT NULL,
    "categoryId" int4 NOT NULL
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
    "role" "public"."Role" DEFAULT 'maker' :: "Role",
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."records";

-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.
-- Sequence and defined type
-- Table Definition
CREATE TABLE "public"."records" (
    "id" int4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "recordedAt" timestamptz NOT NULL,
    "measurements" _float8,
    "longitude" float4,
    "latitude" float4,
    "altitude" float4,
    "deviceId" int4 NOT NULL
);