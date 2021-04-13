insert into users (id, name)
values (
    uuid_generate_v4 (),
    substring(
      (md5(random()::text))
      from 0 for 19
    )
  );
insert into categories ("name", description)
values ('CO2', 'foo');
insert into projects ("userId", name, "categoryId")
values (
    (
      select id
      from users
      order by random()
      limit 1
    ), md5(random()::text), (
      select id
      from categories
      order by random()
      limit 1
    )
  );
insert into devices ("userId", "externalId", "projectId")
values (
    (
      select id
      from users
      order by random()
      limit 1
    ), 'foo', (
      select id
      from projects
      order by random()
      limit 1
    )
  );
insert into records ("deviceId", "recordedAt")
values (
    (
      select id
      from devices
      order by random()
      limit 1
    ), now()
  );