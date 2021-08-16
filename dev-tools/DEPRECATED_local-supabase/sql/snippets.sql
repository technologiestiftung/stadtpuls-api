-- show policies on table
select *
from pg_policies
where tablename = 'projects';
-- show role names
SELECT rolname
FROM pg_roles;
-- drop a policy
drop policy "Allow individual insert access" on public.projects;
-- shows the names of all fk constraints
select *
from information_schema.key_column_usage
where position_in_unique_constraint is not null;