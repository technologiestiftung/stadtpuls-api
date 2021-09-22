-- create a user_profile (no need for real user in auth.users right now)
insert into user_profiles (id)
values (uuid_generate_v4());
select id
from user_profiles;
-- create fake sensors
insert into sensors (user_id, category_id)
select (
    select id
    from user_profiles
    order by random()
    limit 1
  ), 1
from generate_series(1, 1000) as gen (id);
select count(*)
from sensors;