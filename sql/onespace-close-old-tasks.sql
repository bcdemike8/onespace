-- Close everything that was due more than seven days ago
-- ======================================================
-- The Asana import brought a backlog with it. On My work, "Today" sweeps in
-- everything overdue, so a list meant to show what needs doing today opens
-- with seventy-odd tasks that were due in June and July. Closing them is the
-- honest answer: nobody is going to do them, and leaving them open makes the
-- one screen that should say "here is today" unreadable.
--
-- WHAT IT TOUCHES
--   Open tasks (not already DONE) whose due date is more than 7 days ago.
--
-- WHAT IT LEAVES ALONE
--   Tasks due in the last 7 days - you are only a little behind on those.
--   Tasks due in the future.
--   Tasks with no due date at all. "Older than 7 days" means nothing for a
--   task that was never dated, and closing those would be guesswork. If you
--   want them gone too, tell me and that is a different, deliberate line.
--
--   createdAt can't be used here: the import wrote now() into every row, so
--   in the database every imported task was created the day it was imported.
--   The due date is the only real age this data has.
--
-- Run the whole file at once. It backs up first and is reversible - the undo
-- is at the bottom.

BEGIN;

-- 1. What's about to close, and how far back it goes.
select
  count(*)                                    as closing,
  min("dueDate")::date                        as oldest_due,
  max("dueDate")::date                        as newest_due
from onespace."Task"
where status <> 'DONE'
  and "dueDate" is not null
  and "dueDate" < now() - interval '7 days';

-- 2. A sample, so it's clear what kind of thing this is.
select p.name as project, t.name as task, t."dueDate"::date as due
from onespace."Task" t
join onespace."Project" p on p.id = t."projectId"
where t.status <> 'DONE'
  and t."dueDate" is not null
  and t."dueDate" < now() - interval '7 days'
order by t."dueDate"
limit 15;

-- 3. Back up what is about to change, so this can be undone.
drop table if exists onespace.task_close_backup;
create table onespace.task_close_backup as
select id, status, "completedAt"
from onespace."Task"
where status <> 'DONE'
  and "dueDate" is not null
  and "dueDate" < now() - interval '7 days';

-- 4. Close them.
update onespace."Task" t
set status = 'DONE',
    "completedAt" = coalesce(t."completedAt", now())
from onespace.task_close_backup b
where t.id = b.id;

-- 5. What's left.
select
  count(*) filter (where status <> 'DONE')                                  as still_open,
  count(*) filter (where status <> 'DONE' and "dueDate" < now())            as still_overdue,
  count(*) filter (where status <> 'DONE' and "dueDate" is null)            as open_with_no_date
from onespace."Task";

COMMIT;

-- TO UNDO
-- =======
-- The backup table stays behind on purpose. Run this and everything goes
-- back exactly as it was:
--
--   update onespace."Task" t
--   set status = b.status, "completedAt" = b."completedAt"
--   from onespace.task_close_backup b
--   where t.id = b.id;
--
-- Once you're happy, the table can go:
--
--   drop table onespace.task_close_backup;
