-- Where am I? — one row per outstanding step
-- =========================================
-- Paste the whole thing into the Supabase SQL Editor. Read-only: it changes
-- nothing. Each row says DONE or TO DO and what the number should look like.

select * from (

  select 1 as step, 'Billing types' as item,
         case when count(*) filter (where "billingType" = 'NON_BILLABLE') >= 18
              then 'DONE' else 'TO DO — run onespace-billing-types.sql' end as state,
         count(*) filter (where "billingType" = 'NON_BILLABLE')::text
           || ' of 18 projects marked non-billable' as detail
  from onespace."Project"

  union all
  select 2, 'Subtask links',
         case when count(*) >= 91 then 'DONE'
              else 'TO DO — run onespace-subtasks.sql' end,
         count(*)::text || ' of 91 subtasks attached to a parent'
  from onespace."Task" where "parentId" is not null

  union all
  select 3, 'SOW templates',
         case when count(*) = 8 then 'DONE'
              else 'TO DO — run onespace-sow-templates.sql' end,
         count(*)::text || ' of 8 templates loaded'
  from onespace."ProjectTemplate"
  where name like 'Outreach Implementation — Amplify%'

  union all
  -- Tests the rule itself rather than a total, so it can't read DONE just
  -- because the table is small.
  select 4, '60-day task close',
         case when count(*) = 0 then 'DONE'
              else 'TO DO — run onespace-close-stale-tasks-v2.sql' end,
         count(*)::text || ' open tasks are still overdue by more than 60 days'
  from onespace."Task"
  where status <> 'DONE'
    and "dueDate" is not null
    and "dueDate" < current_date - interval '60 days'

  union all
  select 5, 'Everhour re-import',
         case
           when count(*) filter (where source = 'IMPORT') > 0
                and count(*) filter (where source = 'IMPORT'
                                       and date_part('day', date) = 1) < 100
             then 'DONE'
           when count(*) filter (where source = 'IMPORT') > 0
             then 'PART DONE — tagged, but still on month-firsts. Re-upload the dated export with Replace ticked.'
           else 'TO DO — run onespace-tag-import.sql, then re-upload with Replace ticked'
         end,
         count(*) filter (where source = 'IMPORT')::text || ' entries tagged as imported, '
           || count(*) filter (where source = 'MANUAL' and "startedAt" is null
                                 and date_part('day', date) = 1)::text
           || ' still sitting on a month-first'
  from onespace."TimeEntry"

) x order by step;
