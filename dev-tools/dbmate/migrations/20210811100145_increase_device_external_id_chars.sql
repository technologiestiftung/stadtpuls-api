-- migrate:up
ALTER TABLE public.devices
ALTER COLUMN "externalId" TYPE varchar(36);

-- migrate:down
ALTER TABLE public.devices
ALTER COLUMN "externalId" TYPE varchar(20);
