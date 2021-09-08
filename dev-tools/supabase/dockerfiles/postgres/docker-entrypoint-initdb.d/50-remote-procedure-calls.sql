--
--
--
--
--
-- function to allow a user to delete his account
-- this will nuke all his devices and records
create or replace function public.delete_user() returns void LANGUAGE SQL SECURITY DEFINER AS $$
delete from public.user_profiles
where id = auth.uid();
delete from auth.users
where id = auth.uid();
$$;
--
--
--
--
--
-- Function to allow the user to change his email
CREATE OR REPLACE FUNCTION public.update_email(new_email text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$ begin
UPDATE auth.users
set email = new_email
where id = auth.uid();
return found;
end;
$$