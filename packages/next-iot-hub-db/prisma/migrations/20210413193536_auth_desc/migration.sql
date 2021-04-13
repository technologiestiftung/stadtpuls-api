-- CreateEnum
CREATE TYPE "categoryNames" AS ENUM ('Temperatur', 'CO2', 'Luftfeuchtigkeit', 'Druck', 'PAXCounter', 'Lautstärke');

-- CreateEnum
CREATE TYPE "connectionTypes" AS ENUM ('ttn', 'other');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('maker');

-- CreateTable
CREATE TABLE "authtokens" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(100) NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" UUID,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" "categoryNames" NOT NULL,
    "description" VARCHAR(200) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "externalId" VARCHAR(20) NOT NULL,
    "name" VARCHAR(20),
    "projectId" INTEGER NOT NULL,
    "userId" UUID,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectype" "connectionTypes" NOT NULL DEFAULT E'ttn',
    "location" VARCHAR(20),
    "userId" UUID NOT NULL,
    "categoryId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "records" (
    "id" SERIAL NOT NULL,
    "recordedAt" DATE NOT NULL,
    "measurements" DOUBLE PRECISION[],
    "longitude" REAL,
    "latitude" REAL,
    "altitude" REAL,
    "deviceId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(20),
    "createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" DEFAULT E'maker',

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authtokens_projectId_unique" ON "authtokens"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "users.name_unique" ON "users"("name");

-- AddForeignKey
ALTER TABLE "authtokens" ADD FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authtokens" ADD FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
