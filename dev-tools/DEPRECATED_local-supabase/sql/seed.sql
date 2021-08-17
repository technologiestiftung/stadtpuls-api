insert into
  userprofiles (id, name)
values
  (
    uuid_generate_v4 (),
    substring(
      (md5(random() :: text))
      from
        0 for 19
    )
  );

insert into
  projects ("userId", name, "categoryId")
values
  (
    (
      select
        id
      from
        userprofiles
      order by
        random()
      limit
        1
    ), md5(random() :: text), (
      select
        id
      from
        categories
      order by
        random()
      limit
        1
    )
  );

insert into
  devices ("userId", "externalId", "projectId")
values
  (
    (
      select
        id
      from
        userprofiles
      order by
        random()
      limit
        1
    ), 'foo', (
      select
        id
      from
        projects
      order by
        random()
      limit
        1
    )
  );

insert into
  records ("deviceId", "recordedAt", "measurements")
values
  (
    (
      select
        id
      from
        devices
      order by
        random()
      limit
        1
    ), now(),
    (
      select
        array_agg(round(random() * (100 - 0)) + 0)
      from
        generate_series (0, 10)
    )
  );

with first_value as (
  select round((random() * 100 + 20)::numeric, 2) as first_value
),
tss as (
  select
    row_number() over() as id,
    ts,
    (random() - 0.5) * 0.1 + 1 as change
  from
    generate_series(
      (select now() - interval '60 days')::timestamptz,
      (select now())::timestamptz,
      '1 hour'::interval
    ) as ts
) 
insert into
  records ("deviceId", "recordedAt", "measurements")
select
  (
    (
      select
        id
      from
        devices
      order by
        random()
      limit
        1
    ), 
    (
      ts
    ),
    (
      array[ 
        round( first_value*exp(sum(log(change)) over(order by id))::numeric, 2)
      ]
    )
  )
from tss, first_value;