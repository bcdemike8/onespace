-- Domain worksheet: print the list, fill in the blanks, paste it back
-- ====================================================================
-- Read-only. Nothing here changes anything.
--
-- Run it, copy the one big cell each section produces, fill in the domains,
-- and the result drops straight into onespace-client-domains.sql (clients) or
-- onespace-partner-domains.sql (partners).
--
-- Clients come out ordered by how much work they represent, so the ones worth
-- getting right are at the top and the dormant ones are at the bottom.


-- ------------------------------------------------------------ A. CLIENTS
-- One cell. Click it, copy it, fill in the empty quotes.

select string_agg(line, E'\n' order by live desc, hours desc, name) as paste_and_fill
from (
  select c.name,
         count(distinct p.id) filter (where p.status in ('ACTIVE','ON_HOLD')) as live,
         coalesce(sum(t.minutes), 0) / 60.0 as hours,
         '  (''' || replace(c.name, '''', '''''') || ''', ''''),' ||
           repeat(' ', greatest(1, 46 - length(c.name))) ||
           '-- ' ||
           count(distinct p.id) filter (where p.status in ('ACTIVE','ON_HOLD')) ||
           ' live, ' || round(coalesce(sum(t.minutes), 0) / 60.0) || 'h'
           as line
  from onespace."Client" c
    left join onespace."Project" p on p."clientId" = c.id
    left join onespace."TimeEntry" t on t."projectId" = p.id
  where c."archivedAt" is null
    -- Already mapped, so nothing to fill in.
    and not exists (select 1 from onespace."ClientDomain" d where d."clientId" = c.id)
  group by c.name
) rows;


-- ----------------------------------------------------------- B. PARTNERS
-- The companies work comes *through*. Outreach and Salesloft belong here, not
-- in section A - a partner listed as a client makes every joint call look like
-- two customers at once and match neither.

select string_agg(line, E'\n' order by name) as paste_and_fill
from (
  select pt.name,
         '  (''' || replace(pt.name, '''', '''''') || ''', ''''),' as line
  from onespace."Partner" pt
  where pt."archivedAt" is null
    and not exists (select 1 from onespace."PartnerDomain" d where d."partnerId" = pt.id)
  group by pt.name
) rows;


-- --------------------------------------------------- C. ALREADY DONE
-- So you can see what's mapped without scrolling the Clients page.

select 'client' as kind, c.name, string_agg(d.domain, ', ' order by d.domain) as domains
from onespace."Client" c join onespace."ClientDomain" d on d."clientId" = c.id
group by c.name
union all
select 'partner', pt.name, string_agg(d.domain, ', ' order by d.domain)
from onespace."Partner" pt join onespace."PartnerDomain" d on d."partnerId" = pt.id
group by pt.name
order by 1, 2;


-- ------------------------------------------------ D. NAMES THAT MAY DIFFER
-- Clients whose name doesn't obviously suggest a domain, so you don't waste
-- time squinting at "F1 Las Vegas Grand Prix" wondering what they email from.
-- Nothing to do here - it's a reading aid.

select c.name as client,
       string_agg(distinct p.name, ' | ' order by p.name) as projects
from onespace."Client" c
  join onespace."Project" p on p."clientId" = c.id
where c."archivedAt" is null
  and p.status in ('ACTIVE','ON_HOLD')
  and not exists (select 1 from onespace."ClientDomain" d where d."clientId" = c.id)
group by c.name
order by c.name;
