-- Outreach - MSO (3 Months), from the Kustomer managed-services project
--
-- A migration rather than a file in sql/, for the reason the Salesloft
-- template is one: a step that needs somebody to remember it doesn't happen.
--
-- Shape is the Asana project exactly: an intake, then the same three steps
-- in each of three monthly cycles.
--
--   Intake    Book Kickoff Meeting                     day 0
--             Define Project Deliverables and Schedule day 7
--   Month 1   Admin Sync / Team Advanced Topics /
--             Admin Work                               day 21
--   Month 2   the same three                           day 49
--   Month 3   the same three                           day 77
--
-- Offsets come from the export's own dates, counted from the kickoff task:
-- 17 Jun, 24 Jun, 8 Jul, 5 Aug. Month 3 was left undated in Asana, so day 77
-- is this file's arithmetic rather than the export's — 28 days on from month
-- 2, which is the cadence the first two set. It is the one number here that
-- is inferred; change it on the template if the rhythm is meant to be
-- different.
--
-- No hour estimates: the export has no estimate column at all, and inventing
-- a monthly figure would put a number in the budget that nobody agreed. Add
-- them under Templates once the retainer's hours are settled and every
-- project made from it afterwards carries them.
--
-- Its own "Outreach - MSO" heading in the New project picker, so the 6- and
-- 12-month versions have somewhere to land without renaming this one.
--
-- Safe to re-run: deletes and rebuilds only this template, by name.

BEGIN;

DO $$
DECLARE
  v_t text; v_s text; v_i int := 0;
BEGIN
  DELETE FROM onespace."ProjectTemplate" WHERE name = 'Outreach - MSO (3 Months)';

  v_t := gen_random_uuid()::text;
  INSERT INTO onespace."ProjectTemplate" (id,name,"groupName",description,"createdAt","updatedAt")
  VALUES (
    v_t,
    'Outreach - MSO (3 Months)',
    'Outreach - MSO',
    'Outreach managed services, three monthly cycles after intake. Each month is an admin sync, a team advanced-topics session and admin work. Runs 11 weeks from kickoff. No hour estimates yet — add them here and every project made from this afterwards will carry them.',
    now(), now());

  -- Intake
  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Intake', 0);

  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, NULL, 'Book Kickoff Meeting', 0, NULL, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, NULL, 'Define Project Deliverables and Schedule (Include in Project Notes)', 7, NULL, 1);
  v_i := 2;

  -- Month 1 / 2 / 3 — the same three steps, 28 days apart.
  FOR v_i IN 1..3 LOOP
    v_s := gen_random_uuid()::text;
    INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
    VALUES (v_s, v_t, 'Month ' || v_i, v_i);

    INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
    VALUES (gen_random_uuid()::text, v_t, v_s, NULL, 'Admin Sync', 21 + (v_i - 1) * 28, NULL, 2 + (v_i - 1) * 3);
    INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
    VALUES (gen_random_uuid()::text, v_t, v_s, NULL, 'Team Advanced Topics', 21 + (v_i - 1) * 28, NULL, 3 + (v_i - 1) * 3);
    INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
    VALUES (gen_random_uuid()::text, v_t, v_s, NULL, 'Admin Work', 21 + (v_i - 1) * 28, NULL, 4 + (v_i - 1) * 3);
  END LOOP;
END $$;

COMMIT;
