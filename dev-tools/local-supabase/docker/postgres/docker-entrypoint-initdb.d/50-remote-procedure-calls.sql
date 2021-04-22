create or replace function delete_user() returns void LANGUAGE SQL SECURITY DEFINER AS $$
delete from public.userprofiles
where id = auth.uid();
delete from auth.users
where id = auth.uid();
$$;
CREATE OR REPLACE FUNCTION public.update_email(new_email text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $function$ begin
UPDATE auth.users
set email = new_email
where id = auth.uid();
return found;
end;
$function$