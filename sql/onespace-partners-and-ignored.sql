-- Partners, and domains to stop asking about
-- ==========================================
-- From Brianna's classification of the domains her calendar turned up,
-- 10 September 2026.
--
--   Partner    Outreach, Skaled, Murdoch Marketing, Forerunners Group, Apollo
--   Ignore     lytesales.com, greaserconsulting.com, leadfabric.com, l5.ai
--
-- Three of those partners have no record in OneSpace yet, so section 1
-- creates them. Nothing else is touched, and re-running the file is safe.
--
-- Not handled here, because they need a decision rather than a row:
--   canopyworks.com, smarsh.com   clients whose project doesn't exist yet -
--                                 create the project first, then add the
--                                 domain on the Clients page
--   leapfrogservices.com          a prospect. Left visible on purpose: those
--                                 meetings are real time, usually billable to
--                                 an internal business-development project

BEGIN;

-- --------------------------------------------------- 1. partners that exist
-- Created only if the name isn't already there. Rename them on the Clients
-- page afterwards if you'd rather they read differently in reports.

create temp table new_partners (name text);
insert into new_partners (name) values
  ('Murdoch Marketing'),
  ('Forerunners Group'),
  ('Apollo');

select n.name,
       case when p.id is null then 'will be created' else 'already exists' end as outcome
from new_partners n
  left join onespace."Partner" p on p.name = n.name
order by 2, 1;

insert into onespace."Partner" (id, name, "createdAt", "updatedAt")
select 'pt' || replace(gen_random_uuid()::text, '-', ''), n.name, now(), now()
from new_partners n
where not exists (select 1 from onespace."Partner" p where p.name = n.name);


-- ------------------------------------------------------ 2. partner domains

create temp table partner_map (partner text, domain text);
insert into partner_map (partner, domain) values
  ('Outreach',          'outreach.io'),
  ('Skaled',            'skaled.com'),
  ('Murdoch Marketing', 'murdochmktg.com'),
  ('Forerunners Group', 'forerunnersgroup.com'),
  ('Apollo',            'apollo.io');

select m.partner, m.domain,
       case
         when pt.id is null then 'NO SUCH PARTNER'
         when exists (
           select 1 from onespace."PartnerDomain" d
           where d.domain = m.domain and d."partnerId" = pt.id
         ) then 'already there, skipped'
         when exists (
           select 1 from onespace."PartnerDomain" d where d.domain = m.domain
         ) then 'BELONGS TO ANOTHER PARTNER'
         when exists (
           select 1 from onespace."ClientDomain" d where d.domain = m.domain
         ) then 'will be added (also a client domain - deliberate, client wins)'
         else 'will be added'
       end as outcome
from partner_map m
  left join onespace."Partner" pt on pt.name = m.partner
order by 3, 1;

insert into onespace."PartnerDomain" (id, "partnerId", domain, "createdAt")
select 'pd' || replace(gen_random_uuid()::text, '-', ''), pt.id, m.domain, now()
from partner_map m
  join onespace."Partner" pt on pt.name = m.partner
where not exists (
  select 1 from onespace."PartnerDomain" d where d.domain = m.domain
);


-- ------------------------------------------------------ 3. ignored domains
-- Meetings where everyone outside RevOptics is on this list are not stored at
-- all. Take a domain off the list and re-sync and its meetings come straight
-- back, so this is reversible rather than a decision you're stuck with.

create temp table ignore_map (domain text, note text);
insert into ignore_map (domain, note) values
  ('lytesales.com',         'not billable to anyone'),
  ('greaserconsulting.com', 'not billable to anyone'),
  ('leadfabric.com',        'not billable to anyone'),
  ('l5.ai',                 'not billable to anyone');

-- Refuse to ignore a domain that identifies a client: that would silently
-- stop their meetings appearing, which is a miserable bug to track down.
select i.domain,
       case
         when exists (select 1 from onespace."ClientDomain" d where d.domain = i.domain)
           then 'REFUSED - this is a client domain'
         when exists (select 1 from onespace."IgnoredDomain" d where d.domain = i.domain)
           then 'already there, skipped'
         else 'will be ignored'
       end as outcome
from ignore_map i
order by 2, 1;

insert into onespace."IgnoredDomain" (id, domain, note, "createdAt")
select 'ig' || replace(gen_random_uuid()::text, '-', ''), i.domain, i.note, now()
from ignore_map i
where not exists (select 1 from onespace."ClientDomain" d where d.domain = i.domain)
  and not exists (select 1 from onespace."IgnoredDomain" d where d.domain = i.domain);


-- ------------------------- 4. clear out suggestions already made about them
-- Only PENDING ones. Anything already accepted keeps its time entry; anything
-- dismissed stays dismissed.

delete from onespace."Meeting" m
where m.status = 'PENDING'
  and array_length(m."externalDomains", 1) > 0
  and not exists (
    select 1 from unnest(m."externalDomains") as d(domain)
    where not exists (
      select 1 from onespace."IgnoredDomain" i where i.domain = d.domain
    )
  );

COMMIT;


-- ----------------------------------------------------------------- confirm

select 'partner' as kind, pt.name, string_agg(d.domain, ', ' order by d.domain) as domains
from onespace."Partner" pt join onespace."PartnerDomain" d on d."partnerId" = pt.id
group by pt.name
union all
select 'ignored', i.domain, coalesce(i.note, '')
from onespace."IgnoredDomain" i
order by 1, 2;

select count(*) filter (where status = 'PENDING') as still_pending,
       count(*) filter (where status = 'ACCEPTED') as logged
from onespace."Meeting";


-- -------------------------------------------------------------------- undo
--   delete from onespace."IgnoredDomain";
--   delete from onespace."PartnerDomain" where domain in
--     ('murdochmktg.com','forerunnersgroup.com','apollo.io');
--   delete from onespace."Partner"
--     where name in ('Murdoch Marketing','Forerunners Group','Apollo')
--       and not exists (select 1 from onespace."Project" p where p."partnerId" = "Partner".id);
--
-- Then re-sync: deleted suggestions are recreated from the calendar.
