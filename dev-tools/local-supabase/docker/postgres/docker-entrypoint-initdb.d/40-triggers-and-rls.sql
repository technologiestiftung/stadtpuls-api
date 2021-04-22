-- inserts a row into public.userprofiles when a user signs up
-- https://supabase.io/docs/ guides/auth#create-a-publicusers-table
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
create function public.handle_new_user() returns trigger as $$ begin
insert into public.userprofiles (id)
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
alter table public.userprofiles enable row level security;
-- allow read access
-- start users
create policy "Allow read access on public users table" on public.userprofiles for
select using (auth.role() = 'anon');
create policy "Allow read access for authenticated on public users table" on public.userprofiles for
select using (auth.role() = 'authenticated');
create policy "Allow individual insert access" on public.userprofiles for
insert with check (auth.uid() = id);
create policy "Allow individual update access" on public.userprofiles for
update using (auth.uid() = id);
create policy "Allow individual delete access" on public.userprofiles for delete using (auth.uid() = id);
-- end users
-- start categories
create policy "Allow read access on public categories table" on public.categories for
select using (auth.role() = 'anon');
create policy "Allow read access on public categories table authorized" on public.categories for
select using (auth.role() = 'authenticated');
-- end categories
-- start devices
create policy "Allow read access on public devices table" on public.devices for
select using (auth.role() = 'anon');
create policy "Allow read access for authenticated on public devices table" on public.devices for
select using (auth.role() = 'authenticated');
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
create policy "Allow read access for authenticated on public projects table" on public.projects for
select using (auth.role() = 'authenticated');
create policy "Allow individual insert access" on public.projects for
insert with check (auth.uid() = "userId");
create policy "Allow individual insert access for authenticated users" on public.projects for
insert with check (auth.role() = 'authenticated');
create policy "Allow individual update access" on public.projects for
update using (auth.uid() = "userId");
create policy "Allow individual delete access" on public.projects for delete using (auth.uid() = "userId");
-- end projects
-- start records
create policy "Allow read access on public records table" on public.records for
select using (auth.role() = 'anon');
create policy "Allow read access for authenticated on public records table" on public.records for
select using (auth.role() = 'authenticated');
-- end records/
--start authtokens/
-- create policy "Allow individual insert access" on public.authtokens for
-- insert with check (auth.uid() = "userId");
create policy "Allow individual delete access" on public.authtokens for delete using (auth.uid() = "userId");
-- end authtokens