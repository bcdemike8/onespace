-- What's actually wrong
-- =====================
-- Read-only. Changes nothing, safe to run any time, run the whole file.
--
-- Twelve questions, each one a thing that fails quietly. None of these throw
-- an error or show a red box anywhere in the app - they just make something
-- not work, or make a number wrong, and you find out weeks later. Each
-- section prints a count and, where it helps, the rows themselves.
--
-- Read it top to bottom. Anything with a count of 0 is fine.

-- 1. WHO CAN'T SIGN IN ------------------------------------------------------
-- No password set, or switched off. "That email and password don't match" is
-- deliberately vague on the login page, which makes it useless for you.
select '1. cannot sign in' as check, count(*) as rows from onespace."User"
where "passwordHash" is null or "passwordHash" = '' or not "isActive";

select name, email, role,
       case when "passwordHash" is null or "passwordHash" = '' then 'no password'
            when not "isActive" then 'switched off' end as why
from onespace."User"
where "passwordHash" is null or "passwordHash" = '' or not "isActive"
order by name;

-- 2. BILLABLE TIME WORTH NOTHING -------------------------------------------
-- Hours marked billable and stamped at zero per hour. They look logged, they
-- show in the timesheet, and they add nothing to any revenue figure. Caused
-- by a person with no bill rate logging to a project with no rate override.
select '2. billable hours at zero' as check, count(*) as rows,
       round((sum(minutes)/60.0)::numeric, 1) as hours_invisible
from onespace."TimeEntry"
where billable and "billRateCents" = 0;

select u.name, p.name as project, round((sum(t.minutes)/60.0)::numeric, 1) as hours,
       min(t.date)::date as from_date, max(t.date)::date as to_date
from onespace."TimeEntry" t
join onespace."User" u on u.id = t."userId"
join onespace."Project" p on p.id = t."projectId"
where t.billable and t."billRateCents" = 0
group by u.name, p.name order by hours desc limit 20;

-- 3. PEOPLE WITH NO RATES ---------------------------------------------------
-- The cause of section 2, and of a margin that reads as pure profit.
select '3. people with no rate' as check, count(*) as rows from onespace."User"
where "isActive" and ("billRateCents" = 0 or "costRateCents" = 0);

select name, email, "billRateCents"/100 as bill_per_hour, "costRateCents"/100 as cost_per_hour
from onespace."User"
where "isActive" and ("billRateCents" = 0 or "costRateCents" = 0) order by name;

-- 4. CLIENTS WITH NO EMAIL DOMAINS -----------------------------------------
-- Every match - meetings to projects, mail to clients - runs off these. A
-- client without one is invisible to both syncs, silently.
select '4. active clients, no domains' as check, count(*) as rows
from onespace."Client" c
where c."archivedAt" is null
  and not exists (select 1 from onespace."ClientDomain" d where d."clientId" = c.id)
  and exists (select 1 from onespace."Project" p where p."clientId" = c.id and p.status in ('ACTIVE','ON_HOLD'));

select c.name, count(p.id) as open_projects
from onespace."Client" c
join onespace."Project" p on p."clientId" = c.id and p.status in ('ACTIVE','ON_HOLD')
where c."archivedAt" is null
  and not exists (select 1 from onespace."ClientDomain" d where d."clientId" = c.id)
group by c.name order by open_projects desc;

-- 5. CALLS NOBODY FILED -----------------------------------------------------
-- Meetings still waiting on a yes or no. Past a fortnight they are never
-- getting one, and they are the bulk of what makes Meetings unreadable.
select '5. meetings never dealt with' as check,
       count(*) filter (where "startsAt" > now() - interval '7 days')  as last_7_days,
       count(*) filter (where "startsAt" <= now() - interval '7 days') as older
from onespace."Meeting" where status = 'PENDING' and "startsAt" < now();

-- 6. CALLS WITH NO WRITE-UP -------------------------------------------------
-- Inside the seven-day window, so these are the ones that should have one.
-- transcript_note says why, when the sync worked it out.
select '6. recent calls with no write-up' as check, count(*) as rows
from onespace."Meeting"
where "zoomUuid" is not null and summary is null
  and "startsAt" > now() - interval '7 days';

select title, "startsAt"::date as on_day,
       coalesce("transcriptNote", '(no reason recorded)') as why
from onespace."Meeting"
where "zoomUuid" is not null and summary is null
  and "startsAt" > now() - interval '7 days'
order by "startsAt" desc limit 20;

-- 7. PROJECTS WITH NOBODY ACCOUNTABLE --------------------------------------
select '7. open projects with no owner' as check, count(*) as rows
from onespace."Project" where status in ('ACTIVE','ON_HOLD') and "ownerId" is null;

select p.name, c.name as client from onespace."Project" p
left join onespace."Client" c on c.id = p."clientId"
where p.status in ('ACTIVE','ON_HOLD') and p."ownerId" is null order by p.name;

-- 8. PROJECTS OVER BUDGET ---------------------------------------------------
-- Hours logged against the hours sold. Nothing in the app shouts about this.
select '8. projects over their hours budget' as check, count(*) as rows from (
  select p.id from onespace."Project" p
  join onespace."TimeEntry" t on t."projectId" = p.id
  where p.status in ('ACTIVE','ON_HOLD') and p."budgetHours" is not null
  group by p.id, p."budgetHours" having sum(t.minutes)/60.0 > p."budgetHours"
) x;

select p.name, c.name as client, p."budgetHours" as sold,
       round((sum(t.minutes)/60.0)::numeric, 1) as logged,
       round((sum(t.minutes)/60.0 - p."budgetHours")::numeric, 1) as over_by
from onespace."Project" p
join onespace."TimeEntry" t on t."projectId" = p.id
left join onespace."Client" c on c.id = p."clientId"
where p.status in ('ACTIVE','ON_HOLD') and p."budgetHours" is not null
group by p.name, c.name, p."budgetHours"
having sum(t.minutes)/60.0 > p."budgetHours"
order by over_by desc;

-- 9. WORK NOBODY OWNS -------------------------------------------------------
select '9. open tasks with no assignee' as check, count(*) as rows
from onespace."Task" t join onespace."Project" p on p.id = t."projectId"
where t.status <> 'DONE' and t."assigneeId" is null and p.status in ('ACTIVE','ON_HOLD');

-- 10. TIME ON PROJECTS THAT ARE FINISHED -----------------------------------
-- Usually a mis-filed entry: real hours sitting where nobody will invoice.
select '10. time logged to closed projects' as check, count(*) as rows,
       round((sum(t.minutes)/60.0)::numeric, 1) as hours
from onespace."TimeEntry" t join onespace."Project" p on p.id = t."projectId"
where p.status = 'COMPLETED' and t.date > now() - interval '90 days';

-- 11. CLIENT MAIL WITH NOWHERE TO GO ---------------------------------------
select '11. open threads not filed to a project' as check, count(*) as rows
from onespace."MailThread" where status = 'OPEN' and "projectId" is null;

-- 12. NEAR-DUPLICATE CLIENTS ------------------------------------------------
-- Two spellings of one client splits their projects, their domains and their
-- reporting in half.
select '12. clients that look like duplicates' as check, count(*) as rows from (
  select a.name from onespace."Client" a join onespace."Client" b
    on a.id < b.id and lower(regexp_replace(a.name,'[^a-z0-9]','','gi'))
                     = lower(regexp_replace(b.name,'[^a-z0-9]','','gi'))
) d;

select a.name as one, b.name as other from onespace."Client" a
join onespace."Client" b on a.id < b.id
 and lower(regexp_replace(a.name,'[^a-z0-9]','','gi')) = lower(regexp_replace(b.name,'[^a-z0-9]','','gi'));
