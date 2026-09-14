-- What's actually wrong
-- =====================
-- Read-only. Changes nothing, safe to run any time.
--
-- ONE query on purpose. The Supabase SQL editor shows you the result of the
-- last statement it ran, so a file of twenty selects looks like a file with
-- one answer in it. This returns a single table: twelve checks, a count, and
-- enough detail to act on. Anything with a count of 0 is fine.
--
-- Each of these fails quietly. None throws an error or shows a red box
-- anywhere in the app - it just makes something not work, or a number wrong,
-- and you find out weeks later.

with
-- 1. Nobody can sign in without a password, and nobody switched off can.
cannot_sign_in as (
  select name || ' (' || email || ') - ' ||
         case when "passwordHash" is null or "passwordHash" = '' then 'no password'
              else 'switched off' end as detail
  from onespace."User"
  where "passwordHash" is null or "passwordHash" = '' or not "isActive"
),
-- 2. Hours marked billable and stamped at zero per hour. They look logged,
--    they show on the timesheet, and they add nothing to any revenue figure.
zero_rate_time as (
  select u.name || ' on ' || p.name || ' - ' ||
         round((sum(t.minutes)/60.0)::numeric, 1) || 'h' as detail
  from onespace."TimeEntry" t
  join onespace."User" u on u.id = t."userId"
  join onespace."Project" p on p.id = t."projectId"
  where t.billable and t."billRateCents" = 0
  group by u.name, p.name
),
-- 3. The cause of 2, and of a margin that reads as pure profit.
no_rates as (
  select name || ' - bill ' || ("billRateCents"/100) || ', cost ' || ("costRateCents"/100) as detail
  from onespace."User"
  where "isActive" and ("billRateCents" = 0 or "costRateCents" = 0)
),
-- 4. Every match - meetings to projects, mail to clients - runs off these.
--    A client without one is invisible to both syncs.
no_domains as (
  select c.name || ' (' || count(p.id) || ' open project' ||
         case when count(p.id) = 1 then '' else 's' end || ')' as detail
  from onespace."Client" c
  join onespace."Project" p on p."clientId" = c.id and p.status in ('ACTIVE','ON_HOLD')
  where c."archivedAt" is null
    and not exists (select 1 from onespace."ClientDomain" d where d."clientId" = c.id)
  group by c.name
),
-- 5. Calls still waiting on a yes or no, past the point of getting one.
stale_meetings as (
  select title || ' - ' || "startsAt"::date as detail
  from onespace."Meeting"
  where status = 'PENDING' and "startsAt" < now() - interval '7 days'
),
-- 6. Inside the window, so these are the ones that should have a write-up.
--    The note is the sync's own account of why they don't.
no_writeup as (
  select title || ' (' || "startsAt"::date || ') - ' ||
         coalesce("transcriptNote", 'no reason recorded') as detail
  from onespace."Meeting"
  where "zoomUuid" is not null and summary is null
    and "startsAt" > now() - interval '7 days'
),
-- 7. Nobody accountable for the work.
no_owner as (
  select p.name || coalesce(' (' || c.name || ')', '') as detail
  from onespace."Project" p
  left join onespace."Client" c on c.id = p."clientId"
  where p.status in ('ACTIVE','ON_HOLD') and p."ownerId" is null
),
-- 8. Hours logged against hours sold. Nothing in the app shouts about this.
over_budget as (
  select p.name || ' - sold ' || p."budgetHours" || 'h, logged ' ||
         round((sum(t.minutes)/60.0)::numeric, 1) || 'h' as detail
  from onespace."Project" p
  join onespace."TimeEntry" t on t."projectId" = p.id
  where p.status in ('ACTIVE','ON_HOLD') and p."budgetHours" is not null
  group by p.name, p."budgetHours"
  having sum(t.minutes)/60.0 > p."budgetHours"
),
-- 9. Open work with nobody's name on it.
unassigned as (
  select t.name || ' (' || p.name || ')' as detail
  from onespace."Task" t join onespace."Project" p on p.id = t."projectId"
  where t.status <> 'DONE' and t."assigneeId" is null
    and p.status in ('ACTIVE','ON_HOLD')
),
-- 10. Usually a mis-filed entry: real hours where nobody will invoice them.
time_on_closed as (
  select p.name || ' - ' || round((sum(t.minutes)/60.0)::numeric, 1) || 'h' as detail
  from onespace."TimeEntry" t join onespace."Project" p on p.id = t."projectId"
  where p.status = 'COMPLETED' and t.date > now() - interval '90 days'
  group by p.name
),
-- 11. Client mail with nowhere to put the time it generates.
unfiled_mail as (
  select subject as detail from onespace."MailThread"
  where status = 'OPEN' and "projectId" is null
),
-- 12. Two spellings of one client splits their projects and reporting in half.
dupe_clients as (
  select a.name || ' / ' || b.name as detail
  from onespace."Client" a join onespace."Client" b on a.id < b.id
   and lower(regexp_replace(a.name,'[^a-z0-9]','','gi'))
     = lower(regexp_replace(b.name,'[^a-z0-9]','','gi'))
),

checks as (
  select  1 as n, detail from cannot_sign_in
  union all select  2, detail from zero_rate_time
  union all select  3, detail from no_rates
  union all select  4, detail from no_domains
  union all select  5, detail from stale_meetings
  union all select  6, detail from no_writeup
  union all select  7, detail from no_owner
  union all select  8, detail from over_budget
  union all select  9, detail from unassigned
  union all select 10, detail from time_on_closed
  union all select 11, detail from unfiled_mail
  union all select 12, detail from dupe_clients
),
labels(n, label) as (values
  (1,'Cannot sign in'),(2,'Billable hours at £0/hour'),(3,'People with no rate set'),
  (4,'Active clients with no domains'),(5,'Calls never filed (7+ days)'),
  (6,'Recent calls with no write-up'),(7,'Open projects with no owner'),
  (8,'Projects over their hours budget'),(9,'Open tasks with no assignee'),
  (10,'Time logged to closed projects'),(11,'Open mail not filed to a project'),
  (12,'Clients that look like duplicates')
)

select
  l.n                                    as "#",
  l.label                                as "what",
  count(c.detail)                        as "how many",
  -- The first few, so a count of 40 still tells you what kind of thing it is.
  coalesce(string_agg(c.detail, ' | ' order by c.detail) filter (where c.detail is not null), '') as "examples"
from labels l
left join checks c on c.n = l.n
group by l.n, l.label
order by l.n;
