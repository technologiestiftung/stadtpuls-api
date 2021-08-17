-- setup delete cascades
ALTER TABLE "public"."authtokens"
ADD FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."authtokens"
ADD FOREIGN KEY ("userId") REFERENCES "public"."userprofiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."devices"
ADD FOREIGN KEY ("userId") REFERENCES "public"."userprofiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."devices"
ADD FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."projects"
ADD FOREIGN KEY ("userId") REFERENCES "public"."userprofiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."projects"
ADD FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."records"
ADD FOREIGN KEY ("deviceId") REFERENCES "public"."devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- records get deleted from device deletes
-- these cascades below need to be executed if you use prisma
-- alter table public.records drop constraint "records_deviceId_fkey",
--   add constraint "records_deviceId_fkey" foreign key ("deviceId") references devices (id) on delete cascade;
-- -- devices get deleted by project and by user deletes
-- alter table public.devices drop constraint "devices_projectId_fkey",
--   add constraint "devices_projectId_fkey" foreign key ("projectId") references projects (id) on delete cascade;
-- alter table public.devices drop constraint "devices_userId_fkey",
--   add constraint "devices_userId_fkey" foreign key ("userId") references userprofiles(id) on delete cascade;
-- -- projects get deleted by user delete
-- alter table public.projects drop constraint "projects_userId_fkey",
--   add constraint "projects_userId_fkey" foreign key ("userId") references userprofiles (id) on delete cascade;
-- -- authtokens get deleted by user and by project deletes
-- alter table public.authtokens drop constraint "authtokens_userId_fkey",
--   add constraint "authtokens_userId_fkey" foreign key ("userId") references userprofiles (id) on delete cascade;
-- alter table public.authtokens drop constraint "authtokens_projectId_fkey",
--   add constraint "authtokens_projectId_fkey" foreign key ("projectId") references projects (id) on delete cascade;