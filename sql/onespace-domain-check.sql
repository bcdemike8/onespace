-- Did the domain mapping land?
-- =============================
-- Run after onespace-client-domains-filled.sql and
-- onespace-partners-and-ignored.sql. Reads only; changes nothing.
--
-- Expected, if both files ran clean: 46 client domains across 46 clients,
-- 5 partner domains across 3 partners, 4 ignored.

-- ------------------------------------------------------------- 1. the tally

select 'client domains'  as what, count(*) as n from onespace."ClientDomain"
union all
select 'clients with one',      count(distinct "clientId") from onespace."ClientDomain"
union all
select 'partner domains',       count(*) from onespace."PartnerDomain"
union all
select 'ignored domains',       count(*) from onespace."IgnoredDomain";


-- ------------------------------------------------- 2. the ones that matter
-- The five domains that were drowning the sync. Each should now be claimed
-- by something. Anything still 'UNCLAIMED' will keep being skipped.

with checkme(domain) as (values
  ('skaled.com'), ('outreach.io'), ('murdochmktg.com'),
  ('forerunnersgroup.com'), ('greaserconsulting.com'),
  ('muckrack.com'), ('canopyworks.com'), ('pindrop.com')
)
select c.domain,
       coalesce(
         (select 'client: '  || cl.name from onespace."ClientDomain"  d
            join onespace."Client"  cl on cl.id = d."clientId"  where d.domain = c.domain),
         (select 'partner: ' || p.name  from onespace."PartnerDomain" d
            join onespace."Partner" p  on p.id = d."partnerId"  where d.domain = c.domain),
         (select 'ignored'             from onespace."IgnoredDomain" d
            where d.domain = c.domain),
         'UNCLAIMED'
       ) as claimed_by
from checkme c
order by 2, 1;


-- ------------------------------------------------------ 3. clients with none
-- Live work, no domain, so their meetings will never come in.

select cl.name as client,
       count(*) filter (where p.status in ('ACTIVE','ON_HOLD')) as live_projects
from onespace."Client" cl
  left join onespace."Project" p on p."clientId" = cl.id
where cl."archivedAt" is null
  and not exists (select 1 from onespace."ClientDomain" d where d."clientId" = cl.id)
group by cl.name
having count(*) filter (where p.status in ('ACTIVE','ON_HOLD')) > 0
order by 2 desc, 1;
