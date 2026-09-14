-- Clear the meeting backlog
-- =========================
-- 149 calls older than seven days are still sitting on Meetings waiting for
-- somebody to say yes or no. They are never going to get one: the time either
-- got logged another way or it didn't, and the list they clutter is the list
-- you use to deal with this week.
--
-- Dismissing is not deleting. The meeting stays, its write-up stays, its
-- commitments stay, and it still shows on the project. It just stops asking.
--
-- Leaves alone: anything from the last seven days, and anything already
-- dealt with.
--
-- Backs up first. The undo is at the bottom. Run the whole file - the editor
-- shows you the last result, which is the confirmation.

BEGIN;

-- Back up what is about to change.
drop table if exists onespace.meeting_dismiss_backup;
create table onespace.meeting_dismiss_backup as
select id, status
from onespace."Meeting"
where status = 'PENDING' and "startsAt" < now() - interval '7 days';

-- Dismiss them.
update onespace."Meeting" m
set status = 'DISMISSED'
from onespace.meeting_dismiss_backup b
where m.id = b.id;

COMMIT;

-- What you're left with.
select
  (select count(*) from onespace.meeting_dismiss_backup)                          as dismissed,
  count(*) filter (where status = 'PENDING' and "startsAt" < now())               as still_asking,
  count(*) filter (where status = 'PENDING' and "startsAt" > now() - interval '7 days') as from_this_week
from onespace."Meeting";

-- TO UNDO
-- =======
--   update onespace."Meeting" m set status = b.status
--   from onespace.meeting_dismiss_backup b where m.id = b.id;
--
-- Once you're happy:
--   drop table onespace.meeting_dismiss_backup;
