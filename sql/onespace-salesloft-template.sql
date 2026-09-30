-- Salesloft — Do-It-For-You Onboarding, from the signed 2026 SOW
-- =====================================================================
-- Adds one project template and gives it a "Salesloft" heading of its own
-- on New project, so the first Salesloft SOW doesn't land in "Other
-- templates" beside the odds and ends.
--
-- Structure follows the SOW exactly: its consulting blocks are the sections,
-- the RevOptics deliverables and the client's responsibilities are steps and
-- subtasks under them, and the hour estimates sum to the contracted 25.
--
-- Where the hours came from:
--   Requirements & access        0.5   see below
--   Project kick off             1.0   SOW §3 "Project Kick Off — 1 Hour"
--   Weekly status reporting      1.5   see below
--   Workflow intake              1.0   SOW §3 "Workﬂow Intake — 1 Hour"
--   Data workflow & systems      2.0   SOW §3 "— 2 Hours"
--   Configuration               10.0   SOW §3 "Conﬁguration — 10 Hours"
--   User acceptance testing      1.0   SOW §3 "— 1 Hour"
--   Salesloft enablement         7.0   SOW §4 "7 Hours (< 2 Weeks)"
--   Go-live & graduation         1.0   see below
--                               ----
--                               25.0   SOW §3 "up to 25 hours"
--
-- The SOW's named blocks come to 22 of the 25 contracted hours. The other
-- three are not invented work: §2 requires access and licences before
-- anything starts, §3 commits RevOptics to preparing and running the
-- timeline, and §6 makes the month-to-month option conditional on a
-- "ﬁnal post-live graduation call". They are split across Requirements,
-- Weekly status reporting and Go-live above, and any of them can be
-- re-cut on the project without touching this file.
--
-- Inside §4 the SOW names five sessions and a 7-hour total. Two of them are
-- written as plural "Consulting Blocks" - Manager & Admin Training and the
-- Q&A Forums - so those two carry the balance. They are the two the SOW
-- says may be broken down "by day, timezone, user group, or roles".
--
-- Timeline: 35 days, inside the SOW's 4-week minimum and 8-week maximum.
--
-- Safe to re-run: deletes and rebuilds only this template, by name.
-- Projects already created from it keep their tasks - the link is by id and
-- nothing cascades into a live project.

BEGIN;

DO $$
DECLARE
  v_t text; v_s text; v_p text;
BEGIN
  DELETE FROM onespace."ProjectTemplate"
   WHERE name = 'Salesloft — Do-It-For-You Onboarding';

  v_t := gen_random_uuid()::text;
  INSERT INTO onespace."ProjectTemplate" (id,name,"groupName",description,"createdAt","updatedAt")
  VALUES (
    v_t,
    'Salesloft — Do-It-For-You Onboarding',
    'Salesloft',
    'From the signed SOW: 25 hours over 4-8 weeks, $6,800. RevOptics acts as the fractional Salesloft administrator — tactical configuration, standard integrations (CRM, prospecting, enrichment) and leadership and frontline enablement. Configuration phase 15 hours, enablement 7 hours. Additional hours $200/hour; needs written consent beyond 15% of the estimate.',
    now(), now());

  -- ------------------------------------------------------------------
  -- 0. Requirements & access — SOW §2. A gate, not a formality: without
  --    the licences below the engagement reverts to train-the-trainer.
  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Requirements & access', 0);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm the engagement preconditions', 1, 0.5, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Confirm the CRM is Dynamics, HubSpot or Salesforce', 1, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Obtain temporary Salesloft access for the engagement', 2, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Obtain a temporary read-only admin licence for all applicable systems', 2, NULL, 3);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Agree CRM access, if the client chooses to grant it', 2, NULL, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Settle SSO: RevOptics joins the SSO environment, or the engagement becomes train-the-trainer', 2, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Sign an NDA or confidentiality agreement if the client asks for one', 2, NULL, 6);

  -- ------------------------------------------------------------------
  -- 1. Project kick off — SOW §3, 1 hour. Weekly status reporting sits
  --    here because it starts at kickoff and runs to graduation.
  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Project kick off', 1);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the kick off', 3, 1, 7);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Review scope', 3, NULL, 8);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Develop the primary project plan and timeline', 3, NULL, 9);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Schedule and facilitate the project meetings', 3, NULL, 10);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Client: identify the project manager, internal sponsor and executive sponsor', 3, NULL, 11);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Client: provide stakeholders for CRM configuration, governance and permissions, and content creation', 4, NULL, 12);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Client: register the SHAKEN/STIR programme', 4, NULL, 13);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Client: manage the Trust Hub in Salesloft', 4, NULL, 14);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Weekly status reporting through to go-live', 7, 1.5, 15);

  -- ------------------------------------------------------------------
  -- 2. Workflow intake — SOW §3, 1 hour.
  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Workflow intake', 2);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run 1-2 intake workshops', 7, 0.75, 16);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Gather sales and user workflow requirements', 7, NULL, 17);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Gather content strategy requirements', 7, NULL, 18);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Gather IT requirements', 7, NULL, 19);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Finalise requirements and recommend optimisations', 9, 0.25, 20);

  -- ------------------------------------------------------------------
  -- 3. Data workflow & systems configuration — SOW §3, 2 hours.
  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Data workflow & systems configuration', 3);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Configure the recommended field mappings', 10, 0.5, 21);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Configure stages using the company''s own terminology', 11, 0.5, 22);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Configure the integrations, standard or custom', 12, 1, 23);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Salesforce: client configures the CRM Connector settings', 12, NULL, 24);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Salesforce: at least one Salesloft admin connected under Personal CRM settings', 12, NULL, 25);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Salesforce: install the "Insights from Salesloft" package', 12, NULL, 26);

  -- ------------------------------------------------------------------
  -- 4. Configuration — SOW §3, 10 hours. The bulk of the engagement, and
  --    where the >80% Configuration Score is won.
  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Configuration', 4);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Stand up the Salesloft platform and its integrations', 15, 5, 27);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Configure governance settings', 16, 1.5, 28);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Configure automation rules', 17, 1.5, 29);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Configure reporting', 18, 1.5, 30);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Hold the two 30-minute configuration check-ins', 19, 0.5, 31);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm the Salesloft Configuration Score is above 80%', 20, NULL, 32);

  -- ------------------------------------------------------------------
  -- 5. User acceptance testing — SOW §3, 1 hour.
  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'User acceptance testing', 5);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Test the identified workflows', 21, 1, 33);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Client: approve the final workflow before Salesloft goes live', 22, NULL, 34);

  -- ------------------------------------------------------------------
  -- 6. Salesloft enablement — SOW §4, 7 hours over under two weeks. The
  --    two plural blocks carry the balance; see the header.
  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Salesloft enablement', 6);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Enablement planning session (30 mins)', 24, 0.5, 35);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Agree the training timeline, and set the dates and times', 24, NULL, 36);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Split the sessions by day, timezone, user group or role', 24, NULL, 37);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager and admin training', 26, 1.5, 38);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Fundamental training', 28, 1, 39);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Advanced training', 30, 1, 40);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Dedicated Q&A forums — 30-minute open sessions', 33, 3, 41);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm Early Adoption Score above 60% and User Health Score above 90%', 34, NULL, 42);

  -- ------------------------------------------------------------------
  -- 7. Go-live & graduation — SOW §6 makes the month-to-month option
  --    conditional on the post-live graduation call, so it is a step.
  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Go-live & graduation', 7);

  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Hold the post-live graduation call', 35, 0.5, 43);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Hand over documentation and close the engagement', 35, 0.5, 44);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Offer the month-to-month continuation at $2,000 per month', 35, NULL, 45);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Confirm any hours beyond the estimate were consented to in writing', 35, NULL, 46);
END $$;

COMMIT;


-- ------------------------------------------------------------- confirm
-- Expect: 25 hours, 35 days, and a "Salesloft" group.
select t.name,
       t."groupName",
       count(*) filter (where tt."parentId" is null)     as steps,
       count(*) filter (where tt."parentId" is not null) as subtasks,
       sum(tt."estimatedHours")                          as hours,
       max(tt."offsetDays")                              as runs_days
from onespace."ProjectTemplate" t
  join onespace."TemplateTask" tt on tt."templateId" = t.id
where t.name = 'Salesloft — Do-It-For-You Onboarding'
group by 1, 2;

-- Undo:
-- DELETE FROM onespace."ProjectTemplate" WHERE name = 'Salesloft — Do-It-For-You Onboarding';
