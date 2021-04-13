-- inserts a row into public.users when a user signs up
-- https://supabase.io/docs/ guides/auth#create-a-publicusers-table
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
create function public.handle_new_user() returns trigger as $$ begin
insert into public.users (id)
values (new.id);
return new;
end;
$$ language plpgsql security definer;
-- trigger the function every time a user is created
create trigger on_auth_user_created
after
insert on auth.users for each row execute procedure public.handle_new_user();
-- https://supabase.io/docs/guides/auth#disable-realtime-for-private-tables
/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */
begin;
-- remove the realtime publication
drop publication if exists supabase_realtime;
-- re-create the publication but don't enable it for any tables
create publication supabase_realtime;
commit;
-- -- add a table to the publication
-- alter publication supabase_realtime add table records;
-- -- add other tables to the publication
-- alter publication supabase_realtime add table devices;
-- enable row level security for all tables
alter table public.authtokens enable row level security;
alter table public.categories enable row level security;
alter table public.devices enable row level security;
alter table public.projects enable row level security;
alter table public.records enable row level security;
alter table public.users enable row level security;
-- allow read access
-- start users
create policy "Allow read access on public users table" on public.users for
select using (auth.role() = 'anon');
create policy "Allow individual insert access" on public.users for
insert with check (auth.uid() = id);
create policy "Allow individual update access" on public.users for
update using (auth.uid() = id);
create policy "Allow individual delete access" on public.users for delete using (auth.uid() = id);
-- end users
-- start categories
create policy "Allow read access on public categories table" on public.categories for
select using (auth.role() = 'anon');
-- end categories
-- start devices
create policy "Allow read access on public devices table" on public.devices for
select using (auth.role() = 'anon');
create policy "Allow individual insert access" on public.devices for
insert with check (auth.uid() = "userId");
create policy "Allow individual update access" on public.devices for
update using (auth.uid() = "userId");
create policy "Allow individual delete access" on public.devices for delete using (auth.uid() = "userId");
-- end devices
--
-- start projects
create policy "Allow read access on public projects table" on public.projects for
select using (auth.role() = 'anon');
create policy "Allow individual insert access" on public.projects for
insert with check (auth.uid() = "userId");
create policy "Allow individual update access" on public.projects for
update using (auth.uid() = "userId");
create policy "Allow individual delete access" on public.projects for delete using (auth.uid() = "userId");
-- end projects
-- start records
create policy "Allow read access on public records table" on public.records for
select using (auth.role() = 'anon');
-- end records
--start authtokens
create policy "Allow individual insert access" on public.authtokens for
insert with check (auth.uid() = "userId");
create policy "Allow individual delete access" on public.authtokens for delete using (auth.uid() = "userId");
-- end authtokens
-- setup delete cascades
-- records get deleted from device deletes
alter table public.records drop constraint "records_deviceId_fkey",
  add constraint "records_deviceId_fkey" foreign key ("deviceId") references devices (id) on delete cascade;
-- devices get deleted by project and by user deletes
alter table public.devices drop constraint "devices_projectId_fkey",
  add constraint "devices_projectId_fkey" foreign key ("projectId") references projects (id) on delete cascade;
alter table public.devices drop constraint "devices_userId_fkey",
  add constraint "devices_userId_fkey" foreign key ("userId") references users (id) on delete cascade;
-- projects get deleted by user delete
alter table public.projects drop constraint "projects_userId_fkey",
  add constraint "projects_userId_fkey" foreign key ("userId") references users (id) on delete cascade;
-- authtokens get deleted by user and by project deletes
alter table public.authtokens drop constraint "authtokens_userId_fkey",
  add constraint "authtokens_userId_fkey" foreign key ("userId") references users (id) on delete cascade;
alter table public.authtokens drop constraint "authtokens_projectId_fkey",
  add constraint "authtokens_projectId_fkey" foreign key ("projectId") references projects (id) on delete cascade;