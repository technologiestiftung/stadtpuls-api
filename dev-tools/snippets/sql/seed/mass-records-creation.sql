-- TODO: [STADTPULS-397] Fix this snippet or throw it away
insert into user_profiles (id, name)
values (
    uuid_generate_v4 (),
    substring(
      (md5(random()::text))
      from 0 for 19
    )
  );
insert into sensors ("user_id", "external_id")
values (
    (
      select id
      from user_profiles
      order by random()
      limit 1
    ), 'foo', (
      select id
      from categories
      order by random()
      limit 1
    )
  );
insert into records ("sensor_id", "recorded_at", "measurements")
values (
    (
      select id
      from sensors
      order by random()
      limit 1
    ), now(),
    (
      select array_agg(round(random() * (100 - 0)) + 0)
      from generate_series (0, 10)
    )
  );
with first_value as (
  select round((random() * 100 + 20)::numeric, 2) as first_value
),
tss as (
  select row_number() over() as id,
    ts,
    (random() - 0.5) * 0.1 + 1 as change
  from generate_series(
      '2020-12-01'::timestamptz,
      '2021-02-01'::timestamptz,
      '1 hour'::interval
    ) as ts
)
insert into records ("sensor_id", "recorded_at", "measurements")
select (
    (
      select id
      from sensors
      order by random()
      limit 1
    ), (ts), (
      array [
        round( first_value*exp(sum(log(change)) over(order by id))::numeric, 2)
      ]
    )
  )
from tss,
  first_value;