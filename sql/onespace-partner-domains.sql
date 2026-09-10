-- Mapping partners to their email domains
-- =======================================
-- The companies work comes *through* - Outreach, Salesloft - as distinct from
-- the ones it is *for*.
--
-- Why they need their own list: a partner sits in on client calls constantly.
-- If Outreach is registered as a client, every joint implementation call has
-- two customers in the room and matches neither. Listed here, they step aside
-- whenever a real customer is present.
--
-- A domain may appear here *and* against a client. Skaled is the partner work
-- comes through and a customer in its own right; listing skaled.com both ways
-- means a Skaled-and-Lumistry call lands on Lumistry, and a Skaled-only
-- meeting lands on Skaled. That is the intended use, not a mistake.
--
-- Get the list of partner names from onespace-domain-worksheet.sql, section B.

BEGIN;

create temp table partner_map (partner text, domain text);

insert into partner_map (partner, domain) values
  -- ('Outreach',   'outreach.io'),
  -- ('Salesloft',  'salesloft.com'),
  -- ('Skaled',     'skaled.com'),
  ('__replace_me__', '__replace_me__');


-- ------------------------------------------------------------------ checks
-- Anything reported here is not written. Fix it and run the file again.

select m.partner, m.domain,
       case
         when pt.id is null then 'NO SUCH PARTNER - check the spelling against section B'
         when exists (
           select 1 from onespace."PartnerDomain" d
           where d.domain = lower(m.domain) and d."partnerId" <> pt.id
         ) then 'DOMAIN ALREADY BELONGS TO ANOTHER PARTNER'
         when lower(m.domain) !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
           then 'NOT A DOMAIN - no @, no https://, no spaces'
         when exists (
           select 1 from onespace."ClientDomain" d where d.domain = lower(m.domain)
         ) then 'will be added (also a client domain - deliberate, the client wins when both are in the room)'
         when m.domain <> lower(m.domain) then 'will be added, lowercased'
         else 'will be added'
       end as outcome
from partner_map m
  left join onespace."Partner" pt on pt.name = m.partner
where m.partner <> '__replace_me__'
order by 3, 1;


-- ------------------------------------------------------------------ insert

insert into onespace."PartnerDomain" (id, "partnerId", domain, "createdAt")
select
  'pd' || replace(gen_random_uuid()::text, '-', ''),
  pt.id,
  lower(m.domain),
  now()
from partner_map m
  join onespace."Partner" pt on pt.name = m.partner
where m.partner <> '__replace_me__'
  and lower(m.domain) ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
  and not exists (
    select 1 from onespace."PartnerDomain" d where d.domain = lower(m.domain)
  );

COMMIT;


-- ----------------------------------------------------------------- confirm

select pt.name as partner, string_agg(d.domain, ', ' order by d.domain) as domains
from onespace."Partner" pt
  join onespace."PartnerDomain" d on d."partnerId" = pt.id
group by pt.name
order by 1;


-- -------------------------------------------------------------------- undo
--   delete from onespace."PartnerDomain" where domain = 'outreach.io';
--
-- Re-run the calendar sync afterwards to re-match anything still pending.
