-- Mapping clients to their email domains
-- ======================================
-- The Google integration recognises a client by the email domain the people
-- on the other side use. This file helps you fill that in without guessing.
--
-- You can do all of this on the Clients page instead - each client has an
-- "Email domains" row. This exists because sixty clients is a lot of clicking,
-- and because section 2 below tells you the answers rather than making you
-- remember them.
--
-- Nothing here changes anything until you run section 3.

-- ---------------------------------------------------------------- 1. where
-- Which clients still have no domain, and so will never match automatically.
-- Only clients with live work are listed; an archived client doesn't matter.

select c.name as client,
       count(p.id) filter (where p.status in ('ACTIVE','ON_HOLD')) as live_projects
from onespace."Client" c
  left join onespace."Project" p on p."clientId" = c.id
where c."archivedAt" is null
  and not exists (select 1 from onespace."ClientDomain" d where d."clientId" = c.id)
group by c.name
having count(p.id) filter (where p.status in ('ACTIVE','ON_HOLD')) > 0
order by 2 desc, 1;


-- ------------------------------------------------------------- 2. the answers
-- Run the calendar sync first (Meetings -> Sync everyone), then this.
--
-- Every meeting the matcher couldn't place recorded who was in the room. The
-- domains below are the ones your team actually meets with and that OneSpace
-- doesn't recognise, most frequent first. This is the list worth working
-- through - it's real, it's yours, and it's ordered by how much it costs you
-- to leave it undone.

select d.domain,
       count(*) as unmatched_meetings,
       min(m."startsAt")::date as first_seen,
       max(m."startsAt")::date as last_seen,
       (array_agg(distinct m.title order by m.title))[1:3] as example_titles
from onespace."Meeting" m
  cross join lateral unnest(m."externalDomains") as d(domain)
where m."projectId" is null
  and m.status = 'PENDING'
  -- Noise: conferencing, scheduling and mail providers are never a client.
  and d.domain not in (
    'gmail.com','googlemail.com','outlook.com','hotmail.com','yahoo.com',
    'icloud.com','me.com','aol.com',
    'calendly.com','zoom.us','resource.calendar.google.com',
    'group.calendar.google.com','chorus.ai','gong.io','fathom.video'
  )
group by d.domain
order by 2 desc, 1;


-- --------------------------------------------------------------- 3. the fill
-- Pair them up here and run it. Left column is the client's name EXACTLY as it
-- appears in OneSpace; right column is the bare domain, lowercase, no "@".
--
-- A client may have several - add a row each. A domain may only belong to one
-- client; the check below tells you if you've double-booked one before
-- anything is written.

BEGIN;

create temp table domain_map (client text, domain text);

insert into domain_map (client, domain) values
  -- ('Honeycomb',        'honeycomb.io'),
  -- ('Access One',       'accessoneinc.com'),
  -- ('FactoryFix, LLC',  'factoryfix.com'),
  -- ('Suvoda',           'suvoda.com'),
  -- ('Finalsite',        'finalsite.com'),
  -- ('SHRM',             'shrm.org'),
  ('__replace_me__', '__replace_me__');


-- ------------------------------------------------------------------ checks
-- Anything reported here is not written. Fix it and run the file again.

select m.client, m.domain,
       case
         when c.id is null then 'NO SUCH CLIENT - check the spelling against section 1'
         when exists (
           select 1 from onespace."ClientDomain" d
           where d.domain = lower(m.domain) and d."clientId" <> c.id
         ) then 'DOMAIN ALREADY BELONGS TO ANOTHER CLIENT'
         -- lower() here, exactly as the insert does it: a preview that
         -- disagrees with what runs is worse than no preview.
         when lower(m.domain) !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
           then 'NOT A DOMAIN - no @, no https://, no spaces'
         when m.domain <> lower(m.domain) then 'will be added, lowercased'
         else 'will be added'
       end as outcome
from domain_map m
  left join onespace."Client" c on c.name = m.client
where m.client <> '__replace_me__'
order by 3, 1;


-- ------------------------------------------------------------------ insert
-- Only rows that passed every check above go in.

insert into onespace."ClientDomain" (id, "clientId", domain, "createdAt")
select
  -- Prisma expects a cuid-shaped id; anything unique and url-safe works.
  'cd' || replace(gen_random_uuid()::text, '-', ''),
  c.id,
  lower(m.domain),
  now()
from domain_map m
  join onespace."Client" c on c.name = m.client
where m.client <> '__replace_me__'
  and lower(m.domain) ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
  and not exists (
    select 1 from onespace."ClientDomain" d where d.domain = lower(m.domain)
  );

COMMIT;


-- ----------------------------------------------------------------- confirm

select c.name as client, string_agg(d.domain, ', ' order by d.domain) as domains
from onespace."Client" c
  join onespace."ClientDomain" d on d."clientId" = c.id
group by c.name
order by 1;


-- -------------------------------------------------------------------- undo
-- Removing a domain only stops future matching; it changes no logged time.
--
--   delete from onespace."ClientDomain" where domain = 'acme.com';
--
-- Re-run the calendar sync afterwards to re-match anything still pending.
