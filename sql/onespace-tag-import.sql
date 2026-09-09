-- Tag the original Everhour import so OneSpace can replace it
-- ============================================================
-- Your first Everhour import ran before OneSpace recorded where a time entry
-- came from, so those rows are labelled "manual" and the importer's
-- "replace the previous import" option can't see them.
--
-- That import is identifiable: the report had no dates, so every row landed
-- on the FIRST of its month. This tags exactly those rows as an import.
--
-- STEP 1 — look before you leap. Run this on its own first:

select date::date              as dated,
       count(*)                as entries,
       round(sum(minutes)/60.0, 2) as hours
from onespace."TimeEntry"
where source = 'MANUAL'
  and "startedAt" is null
  and date_part('day', date) = 1
  and date between '2026-01-01' and '2026-09-30'
group by date
order by date;

-- These hours should match the monthly totals in your Everhour report:
--
--   2026-01-01   253.75      2026-06-01   309.47
--   2026-02-01   257.10      2026-07-01   282.38
--   2026-03-01   258.07      2026-08-01   287.55
--   2026-04-01   407.15      2026-09-01    25.83
--   2026-05-01   385.68
--
-- If a row doesn't match, you logged real time in OneSpace on the first of
-- that month and it would be caught up in this. Tell me before continuing and
-- I'll narrow it.


-- STEP 2 — once the numbers above look right, run this:

update onespace."TimeEntry"
set source = 'IMPORT'
where source = 'MANUAL'
  and "startedAt" is null
  and date_part('day', date) = 1
  and date between '2026-01-01' and '2026-09-30';


-- STEP 3 — confirm:

select source, count(*) as entries, round(sum(minutes)/60.0, 2) as hours
from onespace."TimeEntry"
group by source order by source;

-- Then go to Import → Time entries, upload the new export, and tick
-- "Replace the N entries a previous import already put on these days".
