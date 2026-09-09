-- Two tidy-ups: Ricky's projects, and the duplicate FactoryFix client
-- ===================================================================
-- Run the whole file at once. It backs up what it changes and is reversible.

BEGIN;

-- ------------------------------------------------- 1. Ricky Cookson's work
-- Everhour lists Ricky as lead on two projects. He has no OneSpace account
-- and isn't with you any more, so both move to you. When the first owners
-- file ran, Okres already landed on you (you'd logged the most hours) and
-- Genz was guessed onto Marcus — this makes both deliberate.
--
-- Tasks nobody is assigned to follow the owner, which is what happens when
-- you change an owner in the app. Tasks already assigned to a person are
-- left with that person: they may still be doing the work.

drop table if exists onespace.cleanup_backup_owners;

create table onespace.cleanup_backup_owners as
select p.id, p.name, p."ownerId" as previous_owner_id, now() as changed_at
from onespace."Project" p
where p.name in (
  'Genz | Outreach Managed Services + Custom API',
  'Okres | Outreach Implementation: Engage (1-19)'
);

update onespace."Project" p
set "ownerId" = (select id from onespace."User"
                 where lower(email) = 'brianna@revoptics.co' limit 1),
    "updatedAt" = now()
where p.name in (
  'Genz | Outreach Managed Services + Custom API',
  'Okres | Outreach Implementation: Engage (1-19)'
);

update onespace."Task" t
set "assigneeId" = p."ownerId", "updatedAt" = now()
from onespace."Project" p
where p.id = t."projectId"
  and t."assigneeId" is null
  and p.name in (
    'Genz | Outreach Managed Services + Custom API',
    'Okres | Outreach Implementation: Engage (1-19)'
  );


-- ------------------------------------------------ 2. Merge the two FactoryFix
-- "Factory Fix" and "FactoryFix, LLC" are the same customer. Everything moves
-- onto the legal name and the spaced version is removed. If you'd rather keep
-- "Factory Fix" as the display name, rename it afterwards on the Clients page
-- — the merge is what matters, not which label survived.

drop table if exists onespace.cleanup_backup_clients;

create table onespace.cleanup_backup_clients as
select p.id as project_id, p.name as project_name, p."clientId" as previous_client_id,
       c.name as previous_client_name, now() as changed_at
from onespace."Project" p join onespace."Client" c on c.id = p."clientId"
where c.name in ('Factory Fix', 'FactoryFix, LLC');

update onespace."Project" p
set "clientId" = (select id from onespace."Client" where name = 'FactoryFix, LLC'),
    "updatedAt" = now()
where p."clientId" = (select id from onespace."Client" where name = 'Factory Fix');

delete from onespace."Client" where name = 'Factory Fix';

COMMIT;


-- ------------------------------------------------------------------ confirm

select name, (select name from onespace."User" u where u.id = p."ownerId") as owner
from onespace."Project" p
where p.name in (
  'Genz | Outreach Managed Services + Custom API',
  'Okres | Outreach Implementation: Engage (1-19)'
);

select c.name as client, count(p.id) as projects
from onespace."Client" c left join onespace."Project" p on p."clientId" = c.id
where c.name ilike '%factory%fix%'
group by 1;


-- ---------------------------------------------------------------------- undo
--   update onespace."Project" p set "ownerId" = b.previous_owner_id
--   from onespace.cleanup_backup_owners b where b.id = p.id;
--
--   insert into onespace."Client" (id,name,"createdAt","updatedAt")
--   select distinct previous_client_id, previous_client_name, now(), now()
--   from onespace.cleanup_backup_clients
--   on conflict (id) do nothing;
--
--   update onespace."Project" p set "clientId" = b.previous_client_id
--   from onespace.cleanup_backup_clients b where b.project_id = p.id;
--
--   drop table onespace.cleanup_backup_owners;
--   drop table onespace.cleanup_backup_clients;
