--
--
--
--
--
-- function to allow a user to delete his account
-- this will nuke all his sensors and records
create or replace function public.delete_user() returns void LANGUAGE SQL SECURITY DEFINER AS $$
delete from public.user_profiles
where id = auth.uid();
delete from auth.users
where id = auth.uid();
$$;