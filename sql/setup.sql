-- RevOptics OneSpace — full Asana migration
-- Generated 2026-09-08
--
--   54 projects · 773 tasks · 50 clients · 7 templates
--
-- HOW TO RUN: Supabase → SQL Editor → New query → paste all of this → Run.
-- It runs as one transaction: everything lands, or nothing does.
-- Safe to re-run — anything already present is skipped.
--
-- ACCOUNTS THIS SCRIPT CREATES — give each person their starting password;
-- they can change it under Your account. An account that already exists
-- keeps its current password and only has its rates updated.
--
--   Brianna Dunbar-DeMike    brianna@revoptics.co       cedar-summit-c0b3      $60/hr cost · $225/hr bill
--   Marcus Callaway          marcus@revoptics.co        harbor-tidal-dffc      $60/hr cost · $225/hr bill
--   Yazmin Dorsey            yazmin@revoptics.co        cedar-cobalt-81be      $60/hr cost · $225/hr bill
--   Shannon Myers            shannon@revoptics.co       quartz-summit-4031     $60/hr cost · $200/hr bill
--   Anastasiya Solovey       anastasiya@revoptics.co    willow-quartz-d45a     $50/hr cost · $100/hr bill
--   Andrew Henningsen        andrew@revoptics.co        meadow-quartz-0e20     $60/hr cost · $225/hr bill
--   Aaron Masters            aaron@revoptics.co         harbor-lantern-4b29    $60/hr cost · $225/hr bill
--
-- Asana assignees found in the exports:
--   Aaron Masters            aaron@revoptics.co         49 tasks
--   Marcus Callaway          marcus@revoptics.co        37 tasks
--   Shannon Myers            shannon@revoptics.co       10 tasks
--   Brianna Dunbar-DeMike    brianna@revoptics.co       9 tasks
--   Andrew Henningsen        andrew@revoptics.co        1 tasks
--
-- CLIENTS CREATED: Accelerate Learning, Access One, AdvanStaff HR, Avam, Avatara LLC, Bay FC, Busright, Candex Solutions, Inc., Daxko, Eightfold, Element451, Epiq Systems Ltd., F1 Las Vegas Grand Prix, Factory Fix, FactoryFix, LLC, Finalsite, Garuda Labs (Instawork), Grail LLC, HYPR, Honeycomb, Impartner, Impetus, Intiveo, Kustomer LLC, LI-COR Biotech, Laurel (Time by Ping), Lumistry, LuxGive, Muck Rack, NoRedInk, Openspace, Panther Labs, Inc, Patient Accounting Service Center, LLC dba GetixHealth, Pindrop, Postscript, PureEHS, Quantinuum, SHRM, Sikich, Simpler Postage, Inc, Spark Hire, Inc., Specright, State Affairs, SuperOps.ai, Suvoda, TTEC, Ushur, Vertiv, Very Good Security (VGS), XSE Group
--
-- PARTNERS CREATED: Association for Talent Development, DailyPay, Nerdio, Okres, Outreach, RevOptics, Roundstone, Salesloft, Wrike
--
-- Partner and project-owner values come from the Everhour report;
-- 44 of the 54 projects matched it by name.

BEGIN;

-- ==========================================================================
-- PEOPLE (7) — created with rates, skipped if already present
-- ==========================================================================
INSERT INTO onespace."User" (id,email,name,"passwordHash",role,"isActive","costRateCents","billRateCents","createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'brianna@revoptics.co', 'Brianna Dunbar-DeMike', 'scrypt$61c840c7238424cc8ab71a25c087e551$7a9d9cd52c1060a615a8c6d4ab459bb5fb009f5af7a06a5732c9b5c2ab4bb14512d69cb93ab9c83556fcc23d205ad8463eea74dbeffc5e8feb3520e3909d5795', 'ADMIN', true, 6000, 22500, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."User" WHERE lower(email) = 'brianna@revoptics.co');
UPDATE onespace."User" SET "costRateCents" = 6000, "billRateCents" = 22500, name = 'Brianna Dunbar-DeMike', "updatedAt" = now()
WHERE lower(email) = 'brianna@revoptics.co';

INSERT INTO onespace."User" (id,email,name,"passwordHash",role,"isActive","costRateCents","billRateCents","createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'marcus@revoptics.co', 'Marcus Callaway', 'scrypt$e200f299135e54b11f50a04b97dfe840$90c1473d0fe9b4030094e9bc5b4b57e76fe4e77d29667921c20360a409d8756ac31b0c6d7be2436d8048a62a74c3f73bd77b12cf27f4445a4532a6b8ef48349f', 'MEMBER', true, 6000, 22500, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co');
UPDATE onespace."User" SET "costRateCents" = 6000, "billRateCents" = 22500, name = 'Marcus Callaway', "updatedAt" = now()
WHERE lower(email) = 'marcus@revoptics.co';

INSERT INTO onespace."User" (id,email,name,"passwordHash",role,"isActive","costRateCents","billRateCents","createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'yazmin@revoptics.co', 'Yazmin Dorsey', 'scrypt$7ee51fe1f5c9322f09c65e6b108a41a1$d009a02e82827e1844ef063a2361161e778ca31439629de129b4fd369b12ee05bb6133a967ac6f36f8cc811462364a78f77f63680d4de8133265584ce303adfe', 'MEMBER', true, 6000, 22500, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."User" WHERE lower(email) = 'yazmin@revoptics.co');
UPDATE onespace."User" SET "costRateCents" = 6000, "billRateCents" = 22500, name = 'Yazmin Dorsey', "updatedAt" = now()
WHERE lower(email) = 'yazmin@revoptics.co';

INSERT INTO onespace."User" (id,email,name,"passwordHash",role,"isActive","costRateCents","billRateCents","createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'shannon@revoptics.co', 'Shannon Myers', 'scrypt$96cf7287e07e60a455421146c59db693$dfb5cee9826120176fb9bc2ef417d9f46d4a4192805467ff2504c181fb25ff2f89846e8ec6b246a53998b58ac5fc5f6c6f9e789b239cee58f81804173f1a8977', 'MEMBER', true, 6000, 20000, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co');
UPDATE onespace."User" SET "costRateCents" = 6000, "billRateCents" = 20000, name = 'Shannon Myers', "updatedAt" = now()
WHERE lower(email) = 'shannon@revoptics.co';

INSERT INTO onespace."User" (id,email,name,"passwordHash",role,"isActive","costRateCents","billRateCents","createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'anastasiya@revoptics.co', 'Anastasiya Solovey', 'scrypt$e459708ebf5e4b40ddaa78d62f5cc58f$faee361aaa00b1bcd79046ce13563162cc6d6729b264e5fe387c8f33df2e360aa3678cec0d68228783c1069d3f05c492dbe42deb43f62bf8a9a04fb43a7e68c5', 'MEMBER', true, 5000, 10000, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."User" WHERE lower(email) = 'anastasiya@revoptics.co');
UPDATE onespace."User" SET "costRateCents" = 5000, "billRateCents" = 10000, name = 'Anastasiya Solovey', "updatedAt" = now()
WHERE lower(email) = 'anastasiya@revoptics.co';

INSERT INTO onespace."User" (id,email,name,"passwordHash",role,"isActive","costRateCents","billRateCents","createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'andrew@revoptics.co', 'Andrew Henningsen', 'scrypt$b8450554a37da34402a01dc4f803a957$975167fb9f4cdad537d1350a42aae19363202d1e8503c6be6be974b025e1b572c0097b4ab1b9150bcc1757db665ee93fbd19301c0da8ed634d18492ad540a87a', 'MEMBER', true, 6000, 22500, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co');
UPDATE onespace."User" SET "costRateCents" = 6000, "billRateCents" = 22500, name = 'Andrew Henningsen', "updatedAt" = now()
WHERE lower(email) = 'andrew@revoptics.co';

INSERT INTO onespace."User" (id,email,name,"passwordHash",role,"isActive","costRateCents","billRateCents","createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'aaron@revoptics.co', 'Aaron Masters', 'scrypt$d34483186748f80d1515fffcda20dad6$6f67f3f9ec771e30fa8388e1fe7e5effd7fda4f039e7a0f25ddc8f67c2b767f22d971e58afc630f69774aa4439107891500b133f814f58736e911d62601e5c32', 'MEMBER', true, 6000, 22500, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."User" WHERE lower(email) = 'aaron@revoptics.co');
UPDATE onespace."User" SET "costRateCents" = 6000, "billRateCents" = 22500, name = 'Aaron Masters', "updatedAt" = now()
WHERE lower(email) = 'aaron@revoptics.co';

-- ==========================================================================
-- TEMPLATES (7) — the repeatable playbooks
-- ==========================================================================
-- Amplify Starter  (from “Impetus | Amplify Starter”, covers 32 projects)
DO $t$
DECLARE v_tpl text := gen_random_uuid()::text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter') THEN RETURN; END IF;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_tpl, 'Amplify Starter', 'Derived from the Asana export of “Impetus | Amplify Starter”. Used by 32 projects.', now(), now());
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s0, v_tpl, 'Amplify Kick Off', 0);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s1, v_tpl, 'Amplify Configuration', 1);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s2, v_tpl, 'Amplify Evaluation', 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Kick Off Meeting', NULL, 0, 2, NULL, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Workflow Call', NULL, NULL, NULL, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'CRM Call', NULL, NULL, NULL, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 14, 10, NULL, 3);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Prompt Testing', NULL, 21, 2, NULL, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Prompt Launching', NULL, 28, 2, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Prompt Evaluation and Feedback', NULL, 42, 2, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'External Launch & Training', NULL, 44, 2, NULL, 7);
END $t$;

-- Outreach Implementation: Engage + Starter Add-On (1-19)  (from “Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)”, covers 5 projects)
DO $t$
DECLARE v_tpl text := gen_random_uuid()::text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage + Starter Add-On (1-19)') THEN RETURN; END IF;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_tpl, 'Outreach Implementation: Engage + Starter Add-On (1-19)', 'Derived from the Asana export of “Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)”. Used by 5 projects.', now(), now());
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s0, v_tpl, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s1, v_tpl, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s2, v_tpl, 'Content Strategy', 2);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s3, v_tpl, 'Data Workflow  & System Configuration', 3);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s4, v_tpl, 'Add-Ons', 4);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s5, v_tpl, 'Pre-Launch', 5);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s6, v_tpl, 'Launch', 6);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s7, v_tpl, 'Complete Project', 7);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 0, 0.5, NULL, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, NULL, NULL, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Schedule Kickoff', NULL, NULL, NULL, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 7, 1.25, NULL, 3);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Load Success Metrics Into SFDC', NULL, NULL, NULL, NULL, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Add Contact Roles into SFDC', NULL, NULL, NULL, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Scheduling Session', NULL, NULL, NULL, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Conduct workflow interviews', NULL, 12, 1, NULL, 7);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Summarize Workflow', NULL, 14, 0.5, NULL, 8);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 16, 0.75, NULL, 9);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Content Workshop', NULL, 21, 1, NULL, 10);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 21, 0.5, NULL, 11);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'CRM Configuration', NULL, 20, 1, NULL, 12);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'CRM Testing', NULL, 27, 1, NULL, 13);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 22, 1, NULL, 14);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Triggers', NULL, 27, 0.75, NULL, 15);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Meet', 'Connect Outreach and Meeting Provider
    Review Kaia Settings
    Develop Content Cards
    Develop Coach Cards
    Create Playlists', 27, 1.5, NULL, 16);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Deal', 'Map required fields: 
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent.
    Enable Forecast and Pipeline Management
    Upload Quotas', 27, 2, NULL, 17);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Forecast', 'Map required fields: 
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent.
    Enable Forecast and Pipeline Management
    Upload Quotas
    Build Metrics
    Test accuracy', 42, 5, NULL, 18);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Introduction to RevOptics Leadership', NULL, 28, NULL, NULL, 19);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Run Pre-launch checkpoint', NULL, 28, 0.75, NULL, 20);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Training Consultation', NULL, 28, 1.5, NULL, 21);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Send user configuration instructions / account set up', NULL, 28, 0.25, NULL, 22);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 35, 2, NULL, 23);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Manager Training', 'To be conducted one week post user training', 42, 1, NULL, 24);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Engage Advanced Topics', NULL, 42, 1, NULL, 25);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Add-On User Training', NULL, 49, 1, NULL, 26);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Add-On Advanced Topics', NULL, 56, 1, NULL, 27);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s7, 'Update CRM', NULL, 56, 0.5, NULL, 28);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s7, 'Introduce Outreach account team', NULL, 56, 0.25, NULL, 29);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s7, 'Weekly meetings', NULL, NULL, NULL, NULL, 30);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s7, 'Weekly emails', NULL, NULL, NULL, NULL, 31);
END $t$;

-- Outreach Implementation: Engage + Starter Add-On (1-19) (variant 2)  (from “LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)”, covers 2 projects)
DO $t$
DECLARE v_tpl text := gen_random_uuid()::text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage + Starter Add-On (1-19) (variant 2)') THEN RETURN; END IF;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_tpl, 'Outreach Implementation: Engage + Starter Add-On (1-19) (variant 2)', 'Derived from the Asana export of “LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)”. Used by 2 projects.', now(), now());
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s0, v_tpl, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s1, v_tpl, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s2, v_tpl, 'Content Strategy', 2);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s3, v_tpl, 'Data Workflow  & System Configuration', 3);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s4, v_tpl, 'Pre-Launch', 4);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s5, v_tpl, 'Launch', 5);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s6, v_tpl, 'Complete Project', 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 0, 0.5, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, NULL, NULL, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Schedule Kickoff', NULL, NULL, NULL, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 0, 1.25, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 3);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Load Success Metrics Into SFDC', NULL, NULL, NULL, NULL, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Add Contact Roles into SFDC', NULL, NULL, NULL, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Conduct workflow interviews', NULL, 2, 1, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Summarize Workflow', NULL, 2, 0.5, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 7);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 7, 0.75, NULL, 8);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Content Workshop', NULL, 10, 1, NULL, 9);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 15, 0.5, NULL, 10);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'CRM Configuration', NULL, 8, 1, NULL, 11);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'CRM Testing', NULL, 9, 1, NULL, 12);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 21, 1, NULL, 13);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Triggers', NULL, 21, 0.75, NULL, 14);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Introduction to RevOptics Leadership', NULL, 21, NULL, NULL, 15);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Run Pre-launch checkpoint', NULL, 29, 0.75, NULL, 16);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Training Consultation', NULL, 37, 1.5, NULL, 17);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Send user configuration instructions / account set up', NULL, 22, 0.25, NULL, 18);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 41, 2, NULL, 19);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Manager Training', 'To be conducted one week post user training', NULL, 1, NULL, 20);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Engage Advanced Topics', NULL, NULL, 1, NULL, 21);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Add-On User Training', NULL, NULL, 1, NULL, 22);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Add-On Advanced Topics', NULL, NULL, 1, NULL, 23);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Update CRM', NULL, 50, 0.5, NULL, 24);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Introduce Outreach account team', NULL, 50, 0.25, NULL, 25);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Troubleshooting call', NULL, NULL, NULL, NULL, 26);
END $t$;

-- Quick Start - 10 Hours  (from “Avam | Quick Start - 10 Hours”, covers 2 projects)
DO $t$
DECLARE v_tpl text := gen_random_uuid()::text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."ProjectTemplate" WHERE name = 'Quick Start - 10 Hours') THEN RETURN; END IF;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_tpl, 'Quick Start - 10 Hours', 'Derived from the Asana export of “Avam | Quick Start - 10 Hours”. Used by 2 projects.', now(), now());
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s0, v_tpl, 'Kickoff & Align', 0);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s1, v_tpl, 'Design', 1);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s2, v_tpl, 'Training & Office Hours', 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Kickoff Call', NULL, 0, 0.75, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Schedule All Milestones', NULL, 0, 0.25, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Workflow Interview', NULL, 6, 0.5, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Content Strategy', NULL, 8, 1.5, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 3);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Content Workshop', NULL, 15, 1.5, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'CRM Configuration', NULL, 14, 2, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'CRM Configuration II', NULL, 16, 4, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Governance', NULL, 21, 2, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 7);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Pre-Launch', NULL, 24, 0.5, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 8);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Confirm Users have scheduled training', NULL, 24, 0.25, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 9);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Office Hours #1', NULL, 37, 1, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 10);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Office Hours #2', NULL, 50, NULL, (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), 11);
END $t$;

-- Outreach Implementation: Engage (20-49)  (from “F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)”, covers 2 projects)
DO $t$
DECLARE v_tpl text := gen_random_uuid()::text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
        v_s8 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage (20-49)') THEN RETURN; END IF;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_tpl, 'Outreach Implementation: Engage (20-49)', 'Derived from the Asana export of “F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)”. Used by 2 projects.', now(), now());
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s0, v_tpl, 'Project Comms', 0);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s1, v_tpl, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 1);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s2, v_tpl, 'Workflow Discovery & Design', 2);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s3, v_tpl, 'Content Strategy', 3);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s4, v_tpl, 'Mid-project progress report', 4);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s5, v_tpl, 'Data Workflow  & System Configuration', 5);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s6, v_tpl, 'Pre-Launch', 6);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s7, v_tpl, 'Launch', 7);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s8, v_tpl, 'Complete Project', 8);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Weekly Email/Slack', NULL, NULL, NULL, NULL, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Weekly Calls/Meetings', NULL, NULL, NULL, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 0, 0.5, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, NULL, NULL, NULL, 3);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Schedule Kickoff', NULL, NULL, NULL, NULL, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 7, 1.5, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Load Success Metrics Into SFDC', NULL, NULL, NULL, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Add Contact Roles into SFDC', NULL, NULL, NULL, NULL, 7);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Complete post kick off follow up', 'request sandbox
request 
advance task mapping 
temporary partner admin seat 
provide technical action items', 7, 0.5, NULL, 8);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Conduct workflow interviews', NULL, 14, 3, NULL, 9);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Summarize Workflow', NULL, 18, 1, NULL, 10);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 18, 1.5, NULL, 11);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Content Workshop', NULL, 21, 2, NULL, 12);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 21, 1, NULL, 13);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Seller | Consultant Sync', NULL, 28, 0.5, NULL, 14);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Introduction to RevOptics Leadership', NULL, 28, NULL, NULL, 15);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'CRM Sandbox Configuration', NULL, 21, 2, NULL, 16);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'CRM Sandbox Testing', NULL, 25, 1, NULL, 17);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'CRM Production Configuration or Migration', NULL, 27, 2, NULL, 18);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'CRM Production Testing', NULL, 29, 1, NULL, 19);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 33, 2, NULL, 20);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Triggers', NULL, 33, 1, NULL, 21);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Run Pre-launch checkpoint', NULL, 35, 1, NULL, 22);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Training Consultation', NULL, 35, 1.5, NULL, 23);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Send user configuration instructions / account set up', NULL, 35, 0.25, NULL, 24);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s7, 'User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 42, 4, NULL, 25);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s7, 'Manager Training', 'To be conducted one week post user training', 49, 2, NULL, 26);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s7, 'Advanced Topics', NULL, 56, 2, NULL, 27);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s8, 'Update CRM', NULL, 56, 0.5, NULL, 28);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s8, 'Conduct Transition call with Outreach account team', NULL, 49, 0.5, NULL, 29);
END $t$;

-- Outreach Implementation: Engage (1-19)  (from “State Affairs | Outreach Implementation: Engage (1-19)”, covers 2 projects)
DO $t$
DECLARE v_tpl text := gen_random_uuid()::text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage (1-19)') THEN RETURN; END IF;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_tpl, 'Outreach Implementation: Engage (1-19)', 'Derived from the Asana export of “State Affairs | Outreach Implementation: Engage (1-19)”. Used by 2 projects.', now(), now());
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s0, v_tpl, 'Project Comms', 0);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s1, v_tpl, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 1);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s2, v_tpl, 'Workflow Discovery & Design', 2);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s3, v_tpl, 'Content Strategy', 3);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s4, v_tpl, 'Data Workflow  & System Configuration', 4);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s5, v_tpl, 'Pre-Launch', 5);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s6, v_tpl, 'Launch', 6);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s7, v_tpl, 'Complete Project', 7);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Weekly Email/Slack', NULL, NULL, NULL, NULL, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Weekly Calls/Meetings', NULL, NULL, NULL, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 0, 0.5, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, NULL, NULL, NULL, 3);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Schedule Kickoff', NULL, NULL, NULL, NULL, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 7, 1.25, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Load Success Metrics Into SFDC', NULL, NULL, NULL, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Add Contact Roles into SFDC', NULL, NULL, NULL, NULL, 7);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Conduct workflow interviews', NULL, 12, 1, NULL, 8);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Summarize Workflow', NULL, 14, 0.5, NULL, 9);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 18, 0.75, NULL, 10);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Content Workshop', NULL, 21, 1, NULL, 11);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 21, 0.5, NULL, 12);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'CRM Configuration', NULL, 25, 1, NULL, 13);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'CRM Testing', NULL, 27, 1, NULL, 14);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 27, 1, NULL, 15);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Triggers', NULL, 27, 0.75, NULL, 16);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Introduction to RevOptics Leadership', NULL, 28, NULL, NULL, 17);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Run Pre-launch checkpoint', NULL, 28, 0.75, NULL, 18);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Training Consultation', NULL, 28, 1, NULL, 19);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Send user configuration instructions / account set up', NULL, 28, 0.25, NULL, 20);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 35, 2, NULL, 21);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Manager Training', 'To be conducted one week post user training', 42, 1, NULL, 22);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s6, 'Advanced Topics', NULL, 42, 1, NULL, 23);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s7, 'Update CRM', NULL, 43, 0.5, NULL, 24);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s7, 'Introduce Outreach account team', NULL, 43, 0.25, NULL, 25);
END $t$;

-- Outreach Optimization (Up to 100)  (from “Finalsite | Outreach Optimization (Up to 100)”, covers 2 projects)
DO $t$
DECLARE v_tpl text := gen_random_uuid()::text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."ProjectTemplate" WHERE name = 'Outreach Optimization (Up to 100)') THEN RETURN; END IF;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_tpl, 'Outreach Optimization (Up to 100)', 'Derived from the Asana export of “Finalsite | Outreach Optimization (Up to 100)”. Used by 2 projects.', now(), now());
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s0, v_tpl, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s1, v_tpl, 'Content Strategy', 1);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s2, v_tpl, 'Data Workflow  & System Configuration', 2);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s3, v_tpl, 'Pre-Launch', 3);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s4, v_tpl, 'Launch', 4);
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex") VALUES (v_s5, v_tpl, 'Communication', 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Develop and manage primary project plan in conjunction with Customer', NULL, NULL, NULL, NULL, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Schedule and facilitate meetings with key stakeholders and internal Customer teams', NULL, NULL, NULL, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Report weekly on key project delays or risks', NULL, NULL, NULL, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s0, 'Help ensure project related follow up items are tracked and resolved', NULL, NULL, NULL, NULL, 3);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Up to four (4) content workshop sessions', NULL, NULL, NULL, NULL, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Conduct gap analysis based on new Content Framework and existing “live” content', NULL, NULL, NULL, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Advise on deployment strategy for net-new content needs and development', NULL, NULL, NULL, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Audit of content-related settings including schedules, rulesets, and collections', NULL, NULL, NULL, NULL, 7);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Develop and implement methodology for long-term content maintenance', NULL, NULL, NULL, NULL, 8);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s1, 'Identify opportunities to utilize best practices that reinforce optimal Customer outcomes', NULL, NULL, NULL, NULL, 9);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'CRM Plugin Audit', NULL, NULL, NULL, NULL, 10);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Provide a review of existing plugin configuration, a list of suggested enhancements, and deploy Customer approved changes', NULL, NULL, NULL, NULL, 11);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Consult on best practice recommendations', NULL, NULL, NULL, NULL, 12);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Facilitate final plugin testing where needed', NULL, NULL, NULL, NULL, 13);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Outreach Governance Audit', NULL, NULL, NULL, NULL, 14);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Review, audit, and document applicable end-user workflows', NULL, NULL, NULL, NULL, 15);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Review governance settings, providing best practice recommendations based on long-term scalability and maintenance needs', NULL, NULL, NULL, NULL, 16);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Align Customer workflows to new settings based on audit findings', NULL, NULL, NULL, NULL, 17);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'Assess current trigger usage and implement recommended automation where advisable', NULL, NULL, NULL, NULL, 18);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s2, 'System Configuration', NULL, NULL, NULL, NULL, 19);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s3, 'Review content, Success Plan Templates, KAIA Cards, and user settings', NULL, NULL, NULL, NULL, 20);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Office Hours', 'Up to four (4) total one-hour Office Hour sessions to be completed within two (2)  weeks post user launch
    All Office Hour sessions shall be limited to no more than 25 users per session', NULL, NULL, NULL, 21);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s4, 'Trainings', NULL, NULL, NULL, NULL, 22);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId",name,description,"offsetDays","estimatedHours","defaultAssigneeId","orderIndex")
  VALUES (gen_random_uuid()::text, v_tpl, v_s5, 'Emails & Ad-Hoc Meetings', NULL, NULL, NULL, NULL, 23);
END $t$;

-- ==========================================================================
-- PARTNERS (9) — from the Everhour report
-- ==========================================================================
INSERT INTO onespace."Partner" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Association for Talent Development', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Partner" WHERE name = 'Association for Talent Development');
INSERT INTO onespace."Partner" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'DailyPay', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Partner" WHERE name = 'DailyPay');
INSERT INTO onespace."Partner" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Nerdio', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Partner" WHERE name = 'Nerdio');
INSERT INTO onespace."Partner" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Okres', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Partner" WHERE name = 'Okres');
INSERT INTO onespace."Partner" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Outreach', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Partner" WHERE name = 'Outreach');
INSERT INTO onespace."Partner" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'RevOptics', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Partner" WHERE name = 'RevOptics');
INSERT INTO onespace."Partner" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Roundstone', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Partner" WHERE name = 'Roundstone');
INSERT INTO onespace."Partner" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Salesloft', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Partner" WHERE name = 'Salesloft');
INSERT INTO onespace."Partner" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Wrike', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Partner" WHERE name = 'Wrike');

-- ==========================================================================
-- CLIENTS (50)
-- ==========================================================================
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Accelerate Learning', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Accelerate Learning');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Access One', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Access One');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'AdvanStaff HR', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'AdvanStaff HR');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Avam', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Avam');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Avatara LLC', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Avatara LLC');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Bay FC', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Bay FC');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Busright', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Busright');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Candex Solutions, Inc.', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Candex Solutions, Inc.');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Daxko', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Daxko');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Eightfold', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Eightfold');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Element451', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Element451');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Epiq Systems Ltd.', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Epiq Systems Ltd.');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'F1 Las Vegas Grand Prix', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'F1 Las Vegas Grand Prix');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Factory Fix', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Factory Fix');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'FactoryFix, LLC', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'FactoryFix, LLC');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Finalsite', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Finalsite');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Garuda Labs (Instawork)', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Garuda Labs (Instawork)');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Grail LLC', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Grail LLC');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'HYPR', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'HYPR');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Honeycomb', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Honeycomb');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Impartner', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Impartner');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Impetus', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Impetus');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Intiveo', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Intiveo');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Kustomer LLC', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Kustomer LLC');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'LI-COR Biotech', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'LI-COR Biotech');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Laurel (Time by Ping)', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Laurel (Time by Ping)');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Lumistry', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Lumistry');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'LuxGive', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'LuxGive');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Muck Rack', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Muck Rack');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'NoRedInk', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'NoRedInk');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Openspace', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Openspace');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Panther Labs, Inc', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Panther Labs, Inc');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Patient Accounting Service Center, LLC dba GetixHealth', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Patient Accounting Service Center, LLC dba GetixHealth');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Pindrop', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Pindrop');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Postscript', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Postscript');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'PureEHS', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'PureEHS');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Quantinuum', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Quantinuum');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'SHRM', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'SHRM');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Sikich', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Sikich');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Simpler Postage, Inc', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Simpler Postage, Inc');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Spark Hire, Inc.', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Spark Hire, Inc.');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Specright', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Specright');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'State Affairs', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'State Affairs');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'SuperOps.ai', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'SuperOps.ai');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Suvoda', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Suvoda');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'TTEC', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'TTEC');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Ushur', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Ushur');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Vertiv', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Vertiv');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'Very Good Security (VGS)', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'Very Good Security (VGS)');
INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
SELECT gen_random_uuid()::text, 'XSE Group', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM onespace."Client" WHERE name = 'XSE Group');

-- ==========================================================================
-- PROJECTS (54)
-- ==========================================================================
-- Accelerate Learning | Outreach Add-On: Amplify  (35 tasks, 45.25h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
        v_s8 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Accelerate Learning | Outreach Add-On: Amplify') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Accelerate Learning';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1;
  v_t := NULL;
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Accelerate Learning | Outreach Add-On: Amplify', v_c, v_pt, v_o, 'ACTIVE', '2026-01-08T00:00:00.000Z'::timestamp(3), '2026-03-12T00:00:00.000Z'::timestamp(3), 45.25, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Content Strategy', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Mid-project progress report', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Data Workflow  & System Configuration', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Add-On', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Pre-Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Launch', 7);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s8, v_p, 'Complete Project', 8);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'TODO', NULL, '2026-01-08T00:00:00.000Z'::timestamp(3), 0.5, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'TODO', NULL, '2026-01-15T00:00:00.000Z'::timestamp(3), 1.5, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Complete post kick off follow up', 'request sandbox
request 
advance task mapping 
temporary partner admin seat 
provide technical action items', 'TODO', NULL, '2026-01-15T00:00:00.000Z'::timestamp(3), 0.5, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct workflow interviews', NULL, 'TODO', NULL, '2026-01-22T00:00:00.000Z'::timestamp(3), 3, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Summarize Workflow', NULL, 'TODO', NULL, '2026-01-26T00:00:00.000Z'::timestamp(3), 1, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'TODO', NULL, '2026-01-26T00:00:00.000Z'::timestamp(3), 1.5, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Workshop', NULL, 'TODO', NULL, '2026-01-29T00:00:00.000Z'::timestamp(3), 2, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'TODO', NULL, '2026-01-29T00:00:00.000Z'::timestamp(3), 1, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Seller | Consultant Sync', NULL, 'TODO', NULL, '2026-02-05T00:00:00.000Z'::timestamp(3), 0.5, 12, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-02-05T00:00:00.000Z'::timestamp(3), NULL, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Sandbox Configuration', NULL, 'TODO', NULL, '2026-01-29T00:00:00.000Z'::timestamp(3), 2, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Sandbox Testing', NULL, 'TODO', NULL, '2026-02-02T00:00:00.000Z'::timestamp(3), 1, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Production Configuration or Migration', NULL, 'TODO', NULL, '2026-02-04T00:00:00.000Z'::timestamp(3), 2, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Production Testing', NULL, 'TODO', NULL, '2026-02-06T00:00:00.000Z'::timestamp(3), 1, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'TODO', NULL, '2026-02-10T00:00:00.000Z'::timestamp(3), 2, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Triggers', NULL, 'TODO', NULL, '2026-02-10T00:00:00.000Z'::timestamp(3), 1, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Meet', NULL, 'TODO', NULL, NULL, NULL, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Deal', NULL, 'TODO', NULL, NULL, NULL, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Forecast', NULL, 'TODO', NULL, NULL, NULL, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Amplify', NULL, 'TODO', NULL, NULL, NULL, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Run Pre-launch checkpoint', NULL, 'TODO', NULL, '2026-02-12T00:00:00.000Z'::timestamp(3), 1, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Training Consultation', NULL, 'TODO', NULL, '2026-02-12T00:00:00.000Z'::timestamp(3), 1.5, 25, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-02-12T00:00:00.000Z'::timestamp(3), 0.25, 26, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-02-19T00:00:00.000Z'::timestamp(3), 4, 27, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Engage Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-02-26T00:00:00.000Z'::timestamp(3), 2, 28, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Engage Advanced Topics', NULL, 'TODO', NULL, '2026-03-05T00:00:00.000Z'::timestamp(3), 2, 29, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Add-On Training', NULL, 'TODO', NULL, '2026-03-05T00:00:00.000Z'::timestamp(3), 4, 30, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Forecast Manager Training', NULL, 'TODO', NULL, '2026-03-05T00:00:00.000Z'::timestamp(3), 3, 31, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Add-On Advanced Topics', NULL, 'TODO', NULL, '2026-03-12T00:00:00.000Z'::timestamp(3), 6, 32, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Update CRM', NULL, 'TODO', NULL, '2026-03-05T00:00:00.000Z'::timestamp(3), 0.5, 33, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Conduct Transition call with Outreach account team', NULL, 'TODO', NULL, '2026-02-26T00:00:00.000Z'::timestamp(3), 0.5, 34, NULL, now(), now());
END $p$;

-- Access One | Amplify Starter  (7 tasks, 12h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Access One | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Access One';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Access One | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-28T00:00:00.000Z'::timestamp(3), '2026-07-28T00:00:00.000Z'::timestamp(3), 12, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', (select id from onespace."User" where lower(email)='andrew@revoptics.co' limit 1), '2026-07-28T00:00:00.000Z'::timestamp(3), 1, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'DONE', NULL, NULL, 5, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'DONE', NULL, NULL, 1, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, NULL, 1, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Emails/Meetings', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, NULL, 2, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, NULL, 2, 6, NULL, now(), now());
END $p$;

-- Access One | Outreach Implementation: Engage + Starter Add-On (1-19)  (24 tasks, 16.5h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Access One | Outreach Implementation: Engage + Starter Add-On (1-19)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Access One';
  v_pt := NULL;
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage + Starter Add-On (1-19) (variant 2)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', v_c, v_pt, v_o, 'ACTIVE', '2026-07-01T00:00:00.000Z'::timestamp(3), '2026-08-26T00:00:00.000Z'::timestamp(3), 16.5, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Content Strategy', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Data Workflow  & System Configuration', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Pre-Launch', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Complete Project', 6);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-01T00:00:00.000Z'::timestamp(3), 0.5, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-01T00:00:00.000Z'::timestamp(3), 1.25, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct workflow interviews', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-08T00:00:00.000Z'::timestamp(3), 1, 6, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Summarize Workflow', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-15T00:00:00.000Z'::timestamp(3), 0.5, 7, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-09T00:00:00.000Z'::timestamp(3), 0.75, 8, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Workshop', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-17T00:00:00.000Z'::timestamp(3), 1, 9, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-22T00:00:00.000Z'::timestamp(3), 0.5, 10, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Configuration', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-13T00:00:00.000Z'::timestamp(3), 1, 11, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Testing', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-14T00:00:00.000Z'::timestamp(3), 1, 12, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-21T00:00:00.000Z'::timestamp(3), 1, 13, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Triggers', NULL, 'TODO', NULL, NULL, 0.75, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-07-29T00:00:00.000Z'::timestamp(3), NULL, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Run Pre-launch checkpoint', NULL, 'TODO', NULL, '2026-07-29T00:00:00.000Z'::timestamp(3), 0.75, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Training Consultation', NULL, 'TODO', NULL, '2026-07-29T00:00:00.000Z'::timestamp(3), 1.5, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-07-29T00:00:00.000Z'::timestamp(3), 0.25, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), 2, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-08-12T00:00:00.000Z'::timestamp(3), 1, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Engage Advanced Topics', NULL, 'TODO', NULL, '2026-08-12T00:00:00.000Z'::timestamp(3), 1, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Update CRM', NULL, 'TODO', NULL, '2026-08-26T00:00:00.000Z'::timestamp(3), 0.5, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Introduce Outreach account team', NULL, 'TODO', NULL, '2026-08-26T00:00:00.000Z'::timestamp(3), 0.25, 23, NULL, now(), now());
END $p$;

-- AdvanStaff HR | Amplify Starter  (6 tasks, 18h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'AdvanStaff HR | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'AdvanStaff HR';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'AdvanStaff HR | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-06-17T00:00:00.000Z'::timestamp(3), '2026-07-31T00:00:00.000Z'::timestamp(3), 18, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-06-17T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-07-01T00:00:00.000Z'::timestamp(3), 8, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-07-15T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-07-29T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-07-31T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Avam | Quick Start - 10 Hours  (12 tasks, 14.25h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Avam | Quick Start - 10 Hours') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Avam';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Quick Start - 10 Hours';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Avam | Quick Start - 10 Hours', v_c, v_pt, v_o, 'ACTIVE', '2026-08-18T00:00:00.000Z'::timestamp(3), '2026-10-07T00:00:00.000Z'::timestamp(3), 14.25, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff & Align', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Training & Office Hours', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kickoff Call', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-08-18T00:00:00.000Z'::timestamp(3), 0.75, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule All Milestones', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-08-18T00:00:00.000Z'::timestamp(3), 0.25, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Workflow Interview', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-08-24T00:00:00.000Z'::timestamp(3), 0.5, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Content Strategy', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-08-26T00:00:00.000Z'::timestamp(3), 1.5, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Content Workshop', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-09-02T00:00:00.000Z'::timestamp(3), 1.5, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'CRM Configuration', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-09-01T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'CRM Configuration II', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-09-03T00:00:00.000Z'::timestamp(3), 4, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Governance', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-09-08T00:00:00.000Z'::timestamp(3), 2, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Pre-Launch', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-09-11T00:00:00.000Z'::timestamp(3), 0.5, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Confirm Users have scheduled training', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-09-11T00:00:00.000Z'::timestamp(3), 0.25, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Office Hours #1', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-09-24T00:00:00.000Z'::timestamp(3), 1, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Office Hours #2', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-10-07T00:00:00.000Z'::timestamp(3), NULL, 11, NULL, now(), now());
END $p$;

-- Avatara LLC | Amplify Starter  (6 tasks, 18h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Avatara LLC | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Avatara LLC';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Avatara LLC | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-05-18T00:00:00.000Z'::timestamp(3), '2026-07-01T00:00:00.000Z'::timestamp(3), 18, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-05-18T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-06-01T00:00:00.000Z'::timestamp(3), 8, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-06-08T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-06-15T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-06-29T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-07-01T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Bay FC | Quick Start - 15 Hours  (11 tasks, 12.75h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Bay FC | Quick Start - 15 Hours') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Bay FC';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Quick Start - 10 Hours';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Bay FC | Quick Start - 15 Hours', v_c, v_pt, v_o, 'ACTIVE', '2026-08-11T00:00:00.000Z'::timestamp(3), '2026-09-10T00:00:00.000Z'::timestamp(3), 12.75, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff & Align', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Training & Office Hours', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kickoff Call', NULL, 'DONE', NULL, '2026-08-11T00:00:00.000Z'::timestamp(3), 0.5, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule All Milestones', NULL, 'TODO', NULL, '2026-08-11T00:00:00.000Z'::timestamp(3), 0.5, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Workflow Interview', NULL, 'DONE', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 0.5, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Content Strategy & Workshop', NULL, 'DONE', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 1.5, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'CRM Configuration', NULL, 'DONE', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 2, 4, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Governance', NULL, 'TODO', NULL, '2026-08-25T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Add-On Configuration', NULL, 'TODO', NULL, '2026-08-27T00:00:00.000Z'::timestamp(3), 4, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Pre-Launch', NULL, 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 0.5, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Confirm Users have scheduled training', NULL, 'TODO', NULL, '2026-09-03T00:00:00.000Z'::timestamp(3), 0.25, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Office Hours #1', NULL, 'TODO', NULL, '2026-09-10T00:00:00.000Z'::timestamp(3), 1, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Office Hours #2', NULL, 'TODO', NULL, NULL, NULL, 10, NULL, now(), now());
END $p$;

-- Busright Outreach Implementation: Engage + Amplify Starter Add-On (1-19)  (30 tasks, 27h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Busright Outreach Implementation: Engage + Amplify Starter Add-On (1-19)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Busright';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage + Starter Add-On (1-19)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Busright Outreach Implementation: Engage + Amplify Starter Add-On (1-19)', v_c, v_pt, v_o, 'ACTIVE', '2026-08-04T00:00:00.000Z'::timestamp(3), '2026-09-29T00:00:00.000Z'::timestamp(3), 27, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Content Strategy', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Data Workflow  & System Configuration', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Add-Ons', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Pre-Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Complete Project', 7);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'TODO', NULL, '2026-08-04T00:00:00.000Z'::timestamp(3), 0.5, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'TODO', NULL, '2026-08-11T00:00:00.000Z'::timestamp(3), 1.25, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct workflow interviews', NULL, 'TODO', NULL, '2026-08-14T00:00:00.000Z'::timestamp(3), 1, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Summarize Workflow', NULL, 'TODO', NULL, '2026-08-18T00:00:00.000Z'::timestamp(3), 0.5, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 0.75, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Workshop', NULL, 'TODO', NULL, '2026-08-25T00:00:00.000Z'::timestamp(3), 1, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'TODO', NULL, '2026-08-25T00:00:00.000Z'::timestamp(3), 0.5, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Configuration', NULL, 'TODO', NULL, '2026-08-27T00:00:00.000Z'::timestamp(3), 1, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Testing', NULL, 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 1, 12, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 1, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Triggers', NULL, 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 0.75, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Meet', 'Connect Outreach and Meeting Provider
    Review Kaia Settings
    Develop Content Cards
    Develop Coach Cards
    Create Playlists', 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 1.5, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Deal', 'Map required fields: 
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent.
    Enable Forecast and Pipeline Management
    Upload Quotas', 'TODO', NULL, '2026-09-15T00:00:00.000Z'::timestamp(3), 2, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Forecast', 'Map required fields: 
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent.
    Enable Forecast and Pipeline Management
    Upload Quotas
    Build Metrics
    Test accuracy', 'TODO', NULL, '2026-09-15T00:00:00.000Z'::timestamp(3), 5, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-09-01T00:00:00.000Z'::timestamp(3), NULL, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Run Pre-launch checkpoint', NULL, 'TODO', NULL, '2026-09-01T00:00:00.000Z'::timestamp(3), 0.75, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Training Consultation', NULL, 'TODO', NULL, '2026-09-01T00:00:00.000Z'::timestamp(3), 1.5, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-09-01T00:00:00.000Z'::timestamp(3), 0.25, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-09-08T00:00:00.000Z'::timestamp(3), 2, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-09-15T00:00:00.000Z'::timestamp(3), 1, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Engage Advanced Topics', NULL, 'TODO', NULL, '2026-09-15T00:00:00.000Z'::timestamp(3), 1, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Add-On User Training', NULL, 'TODO', NULL, '2026-09-22T00:00:00.000Z'::timestamp(3), 1, 25, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Add-On Advanced Topics', NULL, 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), 1, 26, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Update CRM', NULL, 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), 0.5, 27, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Introduce Outreach account team', NULL, 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), 0.25, 28, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Weekly emails & meetings', NULL, 'TODO', NULL, NULL, NULL, 29, NULL, now(), now());
END $p$;

-- Candex Solutions, Inc. | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Candex Solutions, Inc. | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Candex Solutions, Inc.';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Candex Solutions, Inc. | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-06-29T00:00:00.000Z'::timestamp(3), '2026-08-12T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-06-29T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-07-13T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-07-27T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-08-10T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-08-12T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Daxko | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Daxko | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Daxko';
  v_pt := NULL;
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Daxko | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-09-07T00:00:00.000Z'::timestamp(3), '2026-10-21T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', NULL, '2026-09-07T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-09-21T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-09-28T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-10-05T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-10-19T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-10-21T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Eightfold | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Eightfold | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Eightfold';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Eightfold | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-30T00:00:00.000Z'::timestamp(3), '2026-09-14T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', NULL, '2026-07-30T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-27T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-10T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Element451 | Outreach Implementation: Engage + Starter Add-On (1-19)  (29 tasks, 27h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Element451 | Outreach Implementation: Engage + Starter Add-On (1-19)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Element451';
  v_pt := NULL;
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage + Starter Add-On (1-19)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Element451 | Outreach Implementation: Engage + Starter Add-On (1-19)', v_c, v_pt, v_o, 'ACTIVE', '2026-09-01T00:00:00.000Z'::timestamp(3), '2026-10-27T00:00:00.000Z'::timestamp(3), 27, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Content Strategy', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Data Workflow  & System Configuration', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Add-Ons', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Pre-Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Complete Project', 7);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'TODO', NULL, '2026-09-01T00:00:00.000Z'::timestamp(3), 0.5, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'TODO', NULL, '2026-09-08T00:00:00.000Z'::timestamp(3), 1.25, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct workflow interviews', NULL, 'TODO', NULL, '2026-09-11T00:00:00.000Z'::timestamp(3), 1, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Summarize Workflow', NULL, 'TODO', NULL, '2026-09-15T00:00:00.000Z'::timestamp(3), 0.5, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'TODO', NULL, '2026-09-17T00:00:00.000Z'::timestamp(3), 0.75, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Workshop', NULL, 'TODO', NULL, '2026-09-22T00:00:00.000Z'::timestamp(3), 1, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'TODO', NULL, '2026-09-22T00:00:00.000Z'::timestamp(3), 0.5, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Configuration', NULL, 'TODO', NULL, '2026-09-24T00:00:00.000Z'::timestamp(3), 1, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Testing', NULL, 'TODO', NULL, '2026-09-28T00:00:00.000Z'::timestamp(3), 1, 12, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'TODO', NULL, '2026-09-28T00:00:00.000Z'::timestamp(3), 1, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Triggers', NULL, 'TODO', NULL, '2026-09-28T00:00:00.000Z'::timestamp(3), 0.75, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Meet', 'Connect Outreach and Meeting Provider
    Review Kaia Settings
    Develop Content Cards
    Develop Coach Cards
    Create Playlists', 'TODO', NULL, '2026-09-28T00:00:00.000Z'::timestamp(3), 1.5, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Deal', 'Map required fields: 
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent.
    Enable Forecast and Pipeline Management
    Upload Quotas', 'TODO', NULL, '2026-10-13T00:00:00.000Z'::timestamp(3), 2, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Forecast', 'Map required fields: 
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent.
    Enable Forecast and Pipeline Management
    Upload Quotas
    Build Metrics
    Test accuracy', 'TODO', NULL, '2026-10-13T00:00:00.000Z'::timestamp(3), 5, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), NULL, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Run Pre-launch checkpoint', NULL, 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), 0.75, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Training Consultation', NULL, 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), 1.5, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), 0.25, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-10-06T00:00:00.000Z'::timestamp(3), 2, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-10-13T00:00:00.000Z'::timestamp(3), 1, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Engage Advanced Topics', NULL, 'TODO', NULL, '2026-10-13T00:00:00.000Z'::timestamp(3), 1, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Add-On User Training', NULL, 'TODO', NULL, '2026-10-20T00:00:00.000Z'::timestamp(3), 1, 25, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Add-On Advanced Topics', NULL, 'TODO', NULL, '2026-10-27T00:00:00.000Z'::timestamp(3), 1, 26, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Update CRM', NULL, 'TODO', NULL, '2026-10-27T00:00:00.000Z'::timestamp(3), 0.5, 27, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Introduce Outreach account team', NULL, 'TODO', NULL, '2026-10-27T00:00:00.000Z'::timestamp(3), 0.25, 28, NULL, now(), now());
END $p$;

-- Epiq Systems Ltd. | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Epiq Systems Ltd. | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Epiq Systems Ltd.';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Epiq Systems Ltd. | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-08-03T00:00:00.000Z'::timestamp(3), '2026-09-16T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-08-03T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-08-24T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-16T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)  (30 tasks, 32.25h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
        v_s8 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'F1 Las Vegas Grand Prix';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage (20-49)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)', v_c, v_pt, v_o, 'ACTIVE', '2026-08-13T00:00:00.000Z'::timestamp(3), '2026-10-08T00:00:00.000Z'::timestamp(3), 32.25, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Project Comms', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Workflow Discovery & Design', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Content Strategy', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Mid-project progress report', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Data Workflow  & System Configuration', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Pre-Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Launch', 7);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s8, v_p, 'Complete Project', 8);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Email/Slack', NULL, 'TODO', NULL, NULL, NULL, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Calls/Meetings', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 0.5, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 1.5, 5, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Complete post kick off follow up', 'request sandbox
request 
advance task mapping 
temporary partner admin seat 
provide technical action items', 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 0.5, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Conduct workflow interviews', NULL, 'DONE', NULL, '2026-08-27T00:00:00.000Z'::timestamp(3), 3, 9, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Summarize Workflow', NULL, 'DONE', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 1, 10, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'DONE', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 1.5, 11, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Workshop', NULL, 'DONE', NULL, '2026-09-03T00:00:00.000Z'::timestamp(3), 2, 12, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'TODO', NULL, '2026-09-03T00:00:00.000Z'::timestamp(3), 1, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Seller | Consultant Sync', NULL, 'TODO', NULL, '2026-09-10T00:00:00.000Z'::timestamp(3), 0.5, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-09-10T00:00:00.000Z'::timestamp(3), NULL, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'CRM Sandbox Configuration', NULL, 'TODO', NULL, '2026-09-03T00:00:00.000Z'::timestamp(3), 2, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'CRM Sandbox Testing', NULL, 'TODO', NULL, '2026-09-07T00:00:00.000Z'::timestamp(3), 1, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'CRM Production Configuration or Migration', NULL, 'DONE', NULL, '2026-09-09T00:00:00.000Z'::timestamp(3), 2, 18, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'CRM Production Testing', NULL, 'TODO', NULL, '2026-09-11T00:00:00.000Z'::timestamp(3), 1, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'DONE', NULL, '2026-09-15T00:00:00.000Z'::timestamp(3), 2, 20, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Triggers', NULL, 'TODO', NULL, '2026-09-15T00:00:00.000Z'::timestamp(3), 1, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Run Pre-launch checkpoint', NULL, 'TODO', NULL, '2026-09-17T00:00:00.000Z'::timestamp(3), 1, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Training Consultation', NULL, 'TODO', NULL, '2026-09-17T00:00:00.000Z'::timestamp(3), 1.5, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-09-17T00:00:00.000Z'::timestamp(3), 0.25, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-09-24T00:00:00.000Z'::timestamp(3), 4, 25, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-10-01T00:00:00.000Z'::timestamp(3), 2, 26, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Advanced Topics', NULL, 'TODO', NULL, '2026-10-08T00:00:00.000Z'::timestamp(3), 2, 27, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Update CRM', NULL, 'TODO', NULL, '2026-10-08T00:00:00.000Z'::timestamp(3), 0.5, 28, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Conduct Transition call with Outreach account team', NULL, 'TODO', NULL, '2026-10-01T00:00:00.000Z'::timestamp(3), 0.5, 29, NULL, now(), now());
END $p$;

-- FactoryFix, LLC | Amplify Starter  (6 tasks, 18h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'FactoryFix, LLC | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'FactoryFix, LLC';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'FactoryFix, LLC | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-07T00:00:00.000Z'::timestamp(3), '2026-08-20T00:00:00.000Z'::timestamp(3), 18, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-07-07T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'DONE', NULL, '2026-07-21T00:00:00.000Z'::timestamp(3), 8, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'DONE', NULL, '2026-07-28T00:00:00.000Z'::timestamp(3), 2, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-04T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-08-18T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Factory Fix | Outreach Implementation: Engage (1-19)  (25 tasks, 16h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Factory Fix | Outreach Implementation: Engage (1-19)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Factory Fix';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage (1-19)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Factory Fix | Outreach Implementation: Engage (1-19)', v_c, v_pt, v_o, 'ACTIVE', '2026-06-23T00:00:00.000Z'::timestamp(3), '2026-08-05T00:00:00.000Z'::timestamp(3), 16, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Project Comms', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Workflow Discovery & Design', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Content Strategy', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Data Workflow  & System Configuration', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Pre-Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Complete Project', 7);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Email/Slack', NULL, 'TODO', NULL, NULL, NULL, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Calls/Meetings', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', NULL, '2026-06-23T00:00:00.000Z'::timestamp(3), 0.5, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', NULL, '2026-06-30T00:00:00.000Z'::timestamp(3), 1.25, 5, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Conduct workflow interviews', NULL, 'DONE', NULL, '2026-07-03T00:00:00.000Z'::timestamp(3), 1, 8, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Summarize Workflow', NULL, 'DONE', NULL, '2026-07-07T00:00:00.000Z'::timestamp(3), 0.5, 9, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'DONE', NULL, '2026-07-09T00:00:00.000Z'::timestamp(3), 0.75, 10, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Workshop', NULL, 'DONE', NULL, '2026-07-14T00:00:00.000Z'::timestamp(3), 1, 11, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'DONE', NULL, '2026-07-14T00:00:00.000Z'::timestamp(3), 0.5, 12, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Configuration', NULL, 'DONE', NULL, '2026-07-16T00:00:00.000Z'::timestamp(3), 1, 13, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Testing', NULL, 'DONE', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), 1, 14, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'DONE', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), 1, 15, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Triggers', NULL, 'DONE', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), 0.75, 16, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Run Pre-launch checkpoint', NULL, 'DONE', NULL, '2026-07-21T00:00:00.000Z'::timestamp(3), 0.75, 17, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Training Consultation', NULL, 'DONE', NULL, '2026-07-21T00:00:00.000Z'::timestamp(3), 1, 18, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Send user configuration instructions / account set up', NULL, 'DONE', NULL, '2026-07-21T00:00:00.000Z'::timestamp(3), 0.25, 19, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'DONE', NULL, '2026-07-28T00:00:00.000Z'::timestamp(3), 2, 20, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Manager Training', 'To be conducted one week post user training', 'DONE', NULL, '2026-08-04T00:00:00.000Z'::timestamp(3), 1, 21, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Advanced Topics', NULL, 'TODO', NULL, '2026-08-04T00:00:00.000Z'::timestamp(3), 1, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Update CRM', NULL, 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), 0.5, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Introduce Outreach account team', NULL, 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), 0.25, 24, NULL, now(), now());
END $p$;

-- Finalsite | Outreach Optimization (Up to 100)  (24 tasks, 0h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Finalsite | Outreach Optimization (Up to 100)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Finalsite';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Optimization (Up to 100)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Finalsite | Outreach Optimization (Up to 100)', v_c, v_pt, v_o, 'ACTIVE', NULL, NULL, NULL, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Content Strategy', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Data Workflow  & System Configuration', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Pre-Launch', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Launch', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Communication', 5);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Develop and manage primary project plan in conjunction with Customer', NULL, 'DONE', NULL, NULL, NULL, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule and facilitate meetings with key stakeholders and internal Customer teams', NULL, 'DONE', NULL, NULL, NULL, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Report weekly on key project delays or risks', NULL, 'DONE', NULL, NULL, NULL, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Help ensure project related follow up items are tracked and resolved', NULL, 'DONE', NULL, NULL, NULL, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Up to four (4) content workshop sessions', NULL, 'DONE', NULL, NULL, NULL, 4, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct gap analysis based on new Content Framework and existing “live” content', NULL, 'DONE', NULL, NULL, NULL, 5, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Advise on deployment strategy for net-new content needs and development', NULL, 'DONE', NULL, NULL, NULL, 6, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Audit of content-related settings including schedules, rulesets, and collections', NULL, 'DONE', NULL, NULL, NULL, 7, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Develop and implement methodology for long-term content maintenance', NULL, 'DONE', NULL, NULL, NULL, 8, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Identify opportunities to utilize best practices that reinforce optimal Customer outcomes', NULL, 'DONE', NULL, NULL, NULL, 9, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'CRM Plugin Audit', NULL, 'TODO', NULL, NULL, NULL, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Provide a review of existing plugin configuration, a list of suggested enhancements, and deploy Customer approved changes', NULL, 'TODO', NULL, NULL, NULL, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Consult on best practice recommendations', NULL, 'TODO', NULL, NULL, NULL, 12, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Facilitate final plugin testing where needed', NULL, 'TODO', NULL, NULL, NULL, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Outreach Governance Audit', NULL, 'TODO', NULL, NULL, NULL, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Review, audit, and document applicable end-user workflows', NULL, 'TODO', NULL, NULL, NULL, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Review governance settings, providing best practice recommendations based on long-term scalability and maintenance needs', NULL, 'TODO', NULL, NULL, NULL, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Align Customer workflows to new settings based on audit findings', NULL, 'TODO', NULL, NULL, NULL, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Assess current trigger usage and implement recommended automation where advisable', NULL, 'TODO', NULL, NULL, NULL, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'System Configuration', NULL, 'TODO', NULL, NULL, NULL, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Review content, Success Plan Templates, KAIA Cards, and user settings', NULL, 'TODO', NULL, NULL, NULL, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Office Hours', 'Up to four (4) total one-hour Office Hour sessions to be completed within two (2)  weeks post user launch
    All Office Hour sessions shall be limited to no more than 25 users per session', 'TODO', NULL, NULL, NULL, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Trainings', NULL, 'TODO', NULL, NULL, NULL, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Emails & Ad-Hoc Meetings', NULL, 'TODO', NULL, NULL, NULL, 23, NULL, now(), now());
END $p$;

-- Garuda Labs (Instawork) | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Garuda Labs (Instawork) | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Garuda Labs (Instawork)';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Garuda Labs (Instawork) | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-31T00:00:00.000Z'::timestamp(3), '2026-09-15T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', (select id from onespace."User" where lower(email)='shannon@revoptics.co' limit 1), '2026-07-31T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', (select id from onespace."User" where lower(email)='shannon@revoptics.co' limit 1), '2026-08-14T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', (select id from onespace."User" where lower(email)='shannon@revoptics.co' limit 1), '2026-08-21T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', (select id from onespace."User" where lower(email)='shannon@revoptics.co' limit 1), '2026-08-28T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-11T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-15T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Grail LLC | Amplify Starter  (8 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Grail LLC | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Grail LLC';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Grail LLC | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-30T00:00:00.000Z'::timestamp(3), '2026-09-14T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-07-30T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Workflow Call', NULL, 'DONE', NULL, NULL, NULL, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'CRM review', NULL, 'DONE', NULL, NULL, NULL, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 10, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-27T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-10T00:00:00.000Z'::timestamp(3), 2, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 2, 7, NULL, now(), now());
END $p$;

-- HYPR | Outreach Implementation: Amplify Add-on  (28 tasks, 21h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
        v_s8 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'HYPR | Outreach Implementation: Amplify Add-on') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'HYPR';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1;
  v_t := NULL;
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'HYPR | Outreach Implementation: Amplify Add-on', v_c, v_pt, v_o, 'ACTIVE', '2026-02-23T00:00:00.000Z'::timestamp(3), '2026-04-02T00:00:00.000Z'::timestamp(3), 21, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Project Comms', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Workflow Discovery & Design', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Content Strategy', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Data Workflow  & System Configuration', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Add-On', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Pre-Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Launch', 7);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s8, v_p, 'Complete Project', 8);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Email/Slack', NULL, 'TODO', NULL, NULL, NULL, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Calls/Meetings', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', NULL, '2026-02-23T00:00:00.000Z'::timestamp(3), 0.5, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'DONE', NULL, NULL, NULL, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Schedule Kickoff', NULL, 'DONE', NULL, NULL, NULL, 4, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', NULL, '2026-02-25T00:00:00.000Z'::timestamp(3), 1.25, 5, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Load Success Metrics Into SFDC', NULL, 'DONE', NULL, NULL, NULL, 6, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Add Contact Roles into SFDC', NULL, 'DONE', NULL, NULL, NULL, 7, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Conduct workflow interviews', NULL, 'TODO', NULL, '2026-02-27T00:00:00.000Z'::timestamp(3), 1, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Summarize Workflow', NULL, 'TODO', NULL, '2026-03-04T00:00:00.000Z'::timestamp(3), 0.5, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'TODO', NULL, '2026-03-06T00:00:00.000Z'::timestamp(3), 0.75, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Workshop', NULL, 'TODO', NULL, '2026-03-11T00:00:00.000Z'::timestamp(3), 1, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'TODO', NULL, '2026-03-11T00:00:00.000Z'::timestamp(3), 0.5, 12, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Configuration', NULL, 'TODO', NULL, '2026-03-13T00:00:00.000Z'::timestamp(3), 1, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Testing', NULL, 'TODO', NULL, '2026-03-17T00:00:00.000Z'::timestamp(3), 1, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'TODO', NULL, '2026-03-17T00:00:00.000Z'::timestamp(3), 1, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Triggers', NULL, 'TODO', NULL, '2026-03-17T00:00:00.000Z'::timestamp(3), 0.75, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Meet Configuration', NULL, 'TODO', NULL, '2026-03-17T00:00:00.000Z'::timestamp(3), 1.5, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Deal Configuration', 'Map required fields
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent
    Quota Uploads
    Data Validation', 'TODO', NULL, '2026-03-17T00:00:00.000Z'::timestamp(3), 1.5, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-03-18T00:00:00.000Z'::timestamp(3), NULL, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Run Pre-launch checkpoint', NULL, 'TODO', NULL, '2026-03-18T00:00:00.000Z'::timestamp(3), 0.75, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Training Consultation', NULL, 'TODO', NULL, '2026-03-18T00:00:00.000Z'::timestamp(3), 1, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-03-18T00:00:00.000Z'::timestamp(3), 0.25, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session
    Training for Meet or Deal', 'TODO', NULL, '2026-03-25T00:00:00.000Z'::timestamp(3), 3, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-04-01T00:00:00.000Z'::timestamp(3), 1, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Advanced Topics', 'Additional Hour for Meet/Deal add-on', 'TODO', NULL, '2026-04-01T00:00:00.000Z'::timestamp(3), 2, 25, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Update CRM', NULL, 'TODO', NULL, '2026-04-02T00:00:00.000Z'::timestamp(3), 0.5, 26, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Introduce Outreach account team', NULL, 'TODO', NULL, '2026-04-02T00:00:00.000Z'::timestamp(3), 0.25, 27, NULL, now(), now());
END $p$;

-- Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on  (46 tasks, 26.75h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
        v_s8 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Honeycomb';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;
  v_t := NULL;
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', v_c, v_pt, v_o, 'ACTIVE', '2026-05-13T00:00:00.000Z'::timestamp(3), '2026-07-24T00:00:00.000Z'::timestamp(3), 26.75, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Project Comms', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Workflow Discovery & Design', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Content Strategy', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Data Workflow  & System Configuration', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Pre-Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Complete Project', 7);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s8, v_p, 'Amplify Portion Project', 8);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Email/Slack', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), NULL, NULL, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Calls/Meetings', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-05-13T00:00:00.000Z'::timestamp(3), 0.5, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-05-14T00:00:00.000Z'::timestamp(3), 1.5, 5, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Complete post kick off follow up', 'request sandbox
request 
advance task mapping 
temporary partner admin seat 
provide technical action items', 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-06-04T00:00:00.000Z'::timestamp(3), 0.5, 8, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Scheduling Session', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-06-03T00:00:00.000Z'::timestamp(3), NULL, 9, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Conduct workflow interviews', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-05-28T00:00:00.000Z'::timestamp(3), 3, 10, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-06-10T00:00:00.000Z'::timestamp(3), 1.5, 11, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Workshop', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-06-17T00:00:00.000Z'::timestamp(3), 2, 12, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Production Configuration', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-06-05T00:00:00.000Z'::timestamp(3), 2, 13, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Production Testing', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-06-16T00:00:00.000Z'::timestamp(3), 1, 14, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-06-17T00:00:00.000Z'::timestamp(3), 2, 15, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Triggers', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-06-17T00:00:00.000Z'::timestamp(3), 1, 16, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Run Pre-launch checkpoint', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-06-23T00:00:00.000Z'::timestamp(3), 1, 17, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Training Consultation', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-06T00:00:00.000Z'::timestamp(3), 1.5, 18, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Send user configuration instructions / account set up', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-07T00:00:00.000Z'::timestamp(3), 0.25, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-09T00:00:00.000Z'::timestamp(3), 4, 20, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Manager Training', 'To be conducted one week post user training', 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-16T00:00:00.000Z'::timestamp(3), 2, 21, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Advanced Topics', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-23T00:00:00.000Z'::timestamp(3), 2, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Update CRM', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-23T00:00:00.000Z'::timestamp(3), 0.5, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Conduct Transition call with Outreach account team', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-16T00:00:00.000Z'::timestamp(3), 0.5, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Amplify Project Kick Off', NULL, 'DONE', (select id from onespace."User" where lower(email)='brianna@revoptics.co' limit 1), '2026-05-14T00:00:00.000Z'::timestamp(3), NULL, 25, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Amplify Discovery Call', 'https://us06web.zoom.us/rec/share/M4-fSWRt5gsZiPaK-1WEsDcJ3PIZA9H3a2Ok2wVVOZrXssIm5w7KO5Vi981L_Egl.coqKUhC6me9kvQzV?startTime=1779821822000
Passcode: !V#i8BZ?', 'DONE', (select id from onespace."User" where lower(email)='brianna@revoptics.co' limit 1), '2026-05-26T00:00:00.000Z'::timestamp(3), NULL, 26, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Amplify Use Case Identification Workflow', NULL, 'TODO', (select id from onespace."User" where lower(email)='brianna@revoptics.co' limit 1), '2026-06-03T00:00:00.000Z'::timestamp(3), NULL, 27, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Honeycomb to Outline Desired Use Cases', NULL, 'TODO', NULL, NULL, NULL, 28, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Amplify CRM Field Mapping', NULL, 'TODO', (select id from onespace."User" where lower(email)='brianna@revoptics.co' limit 1), '2026-06-25T00:00:00.000Z'::timestamp(3), NULL, 29, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Honeycomb to Confirm Proper Field Mapping', NULL, 'TODO', NULL, NULL, NULL, 30, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Honeycomb to Ensure 3rd Party Connection Information', '6th Sense 
LeadIQ

Trevor
Tina

June 25 10am CT', 'TODO', NULL, NULL, NULL, 31, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Use Case #1 Prompting Draft', 'Trevor 
Tina
Carolyn 

June 25th 1pm CT', 'TODO', (select id from onespace."User" where lower(email)='brianna@revoptics.co' limit 1), '2026-06-30T00:00:00.000Z'::timestamp(3), NULL, 32, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Use Case #1 Outlined & Accepted on Move-Forward', NULL, 'TODO', NULL, NULL, NULL, 33, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'RevOptics to Help Draft Use Case #1', NULL, 'TODO', NULL, NULL, NULL, 34, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Honeycomb to Insert Use Case #1', NULL, 'TODO', NULL, NULL, NULL, 35, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Team to Review Output and Mapping', NULL, 'TODO', NULL, NULL, NULL, 36, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Use Case #1 Launched', NULL, 'TODO', (select id from onespace."User" where lower(email)='brianna@revoptics.co' limit 1), '2026-07-07T00:00:00.000Z'::timestamp(3), NULL, 37, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Use Case #2 Prompting Draft', NULL, 'TODO', (select id from onespace."User" where lower(email)='brianna@revoptics.co' limit 1), '2026-07-07T00:00:00.000Z'::timestamp(3), NULL, 38, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Use Case #2 Outlined & Accepted on Move-Forward', NULL, 'TODO', NULL, NULL, NULL, 39, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Honeycomb to Draft Use Case #2', NULL, 'TODO', NULL, NULL, NULL, 40, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'RevOptics to Review and Provide Feedback', NULL, 'TODO', NULL, NULL, NULL, 41, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Honeycomb to Insert Use Case #2', NULL, 'TODO', NULL, NULL, NULL, 42, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Team to Review Output and Mapping', NULL, 'TODO', NULL, NULL, NULL, 43, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Use Case #2 Launched', NULL, 'TODO', (select id from onespace."User" where lower(email)='brianna@revoptics.co' limit 1), '2026-07-14T00:00:00.000Z'::timestamp(3), NULL, 44, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, '1-Hour Enablement/End User Training', NULL, 'TODO', (select id from onespace."User" where lower(email)='brianna@revoptics.co' limit 1), '2026-07-24T00:00:00.000Z'::timestamp(3), NULL, 45, NULL, now(), now());
END $p$;

-- Impartner | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Impartner | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Impartner';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Impartner | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-06-17T00:00:00.000Z'::timestamp(3), '2026-07-31T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', NULL, '2026-06-17T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-07-01T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-07-15T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-07-29T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-07-31T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Impetus | Amplify Starter  (8 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Impetus | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Impetus';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Impetus | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-08-03T00:00:00.000Z'::timestamp(3), '2026-09-16T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-08-03T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Workflow Call', NULL, 'DONE', NULL, NULL, NULL, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'CRM Call', NULL, 'DONE', NULL, NULL, NULL, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 10, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-08-24T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 2, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-16T00:00:00.000Z'::timestamp(3), 2, 7, NULL, now(), now());
END $p$;

-- Intiveo | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Intiveo | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Intiveo';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Intiveo | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-06-22T00:00:00.000Z'::timestamp(3), '2026-08-05T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', 'Research + Personalization for calls', 'TODO', (select id from onespace."User" where lower(email)='shannon@revoptics.co' limit 1), '2026-06-22T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', (select id from onespace."User" where lower(email)='shannon@revoptics.co' limit 1), '2026-07-06T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', (select id from onespace."User" where lower(email)='shannon@revoptics.co' limit 1), '2026-07-13T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', (select id from onespace."User" where lower(email)='shannon@revoptics.co' limit 1), '2026-07-20T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', (select id from onespace."User" where lower(email)='shannon@revoptics.co' limit 1), '2026-08-03T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', (select id from onespace."User" where lower(email)='shannon@revoptics.co' limit 1), '2026-08-05T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Kustomer LLC | Outreach Managed Services 3 Months  (11 tasks, 0h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Kustomer LLC | Outreach Managed Services 3 Months') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Kustomer LLC';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;
  v_t := NULL;
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Kustomer LLC | Outreach Managed Services 3 Months', v_c, v_pt, v_o, 'ACTIVE', '2026-06-17T00:00:00.000Z'::timestamp(3), '2026-08-05T00:00:00.000Z'::timestamp(3), NULL, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Intake', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Month 1', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Month 2', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Month 3', 3);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Book Kickoff Meeting', NULL, 'DONE', NULL, '2026-06-17T00:00:00.000Z'::timestamp(3), NULL, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Define Project Deliverables and Schedule (Include in Project Notes)', NULL, 'TODO', NULL, '2026-06-24T00:00:00.000Z'::timestamp(3), NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Admin Sync', NULL, 'DONE', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), NULL, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Team Advanced Topics', NULL, 'DONE', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), NULL, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Admin Work', NULL, 'TODO', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Admin Sync', NULL, 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Team Advanced Topics', NULL, 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), NULL, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Admin Work', NULL, 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), NULL, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Admin Sync', NULL, 'TODO', NULL, NULL, NULL, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Team Advanced Topics', NULL, 'TODO', NULL, NULL, NULL, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Admin Work', NULL, 'TODO', NULL, NULL, NULL, 10, NULL, now(), now());
END $p$;

-- LI-COR Biotech | Amplify Starter  (8 tasks, 18h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'LI-COR Biotech | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'LI-COR Biotech';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'LI-COR Biotech | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-20T00:00:00.000Z'::timestamp(3), '2026-09-11T00:00:00.000Z'::timestamp(3), 18, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-07-24T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Use Case/ Workflow Discovery', NULL, 'DONE', NULL, NULL, NULL, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Use Case Alignment (One)', NULL, 'DONE', NULL, NULL, NULL, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'DONE', NULL, '2026-08-07T00:00:00.000Z'::timestamp(3), 8, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'DONE', NULL, '2026-08-21T00:00:00.000Z'::timestamp(3), 2, 4, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'DONE', NULL, '2026-08-28T00:00:00.000Z'::timestamp(3), 2, 5, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-09T00:00:00.000Z'::timestamp(3), 2, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-11T00:00:00.000Z'::timestamp(3), 2, 7, NULL, now(), now());
END $p$;

-- Laurel (Time by Ping) Outreach Implementation: Engage (20-49)  (30 tasks, 32.25h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
        v_s8 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Laurel (Time by Ping) Outreach Implementation: Engage (20-49)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Laurel (Time by Ping)';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage (20-49)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', v_c, v_pt, v_o, 'ACTIVE', '2026-04-16T00:00:00.000Z'::timestamp(3), '2026-07-10T00:00:00.000Z'::timestamp(3), 32.25, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Project Comms', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Workflow Discovery & Design', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Content Strategy', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Mid-project progress report', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Data Workflow  & System Configuration', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Pre-Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Launch', 7);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s8, v_p, 'Complete Project', 8);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Email/Slack', NULL, 'TODO', NULL, NULL, NULL, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Calls/Meetings', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', NULL, '2026-04-16T00:00:00.000Z'::timestamp(3), 0.5, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', NULL, '2026-04-23T00:00:00.000Z'::timestamp(3), 1.5, 5, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Complete post kick off follow up', 'request sandbox
request 
advance task mapping 
temporary partner admin seat 
provide technical action items', 'TODO', NULL, '2026-04-23T00:00:00.000Z'::timestamp(3), 0.5, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Conduct workflow interviews', NULL, 'DONE', NULL, '2026-04-30T00:00:00.000Z'::timestamp(3), 3, 9, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Summarize Workflow', NULL, 'DONE', NULL, '2026-05-04T00:00:00.000Z'::timestamp(3), 1, 10, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'DONE', NULL, '2026-05-04T00:00:00.000Z'::timestamp(3), 1.5, 11, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Workshop', NULL, 'DONE', NULL, '2026-05-07T00:00:00.000Z'::timestamp(3), 2, 12, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'DONE', NULL, '2026-05-07T00:00:00.000Z'::timestamp(3), 1, 13, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Seller | Consultant Sync', NULL, 'TODO', NULL, '2026-05-14T00:00:00.000Z'::timestamp(3), 0.5, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-05-14T00:00:00.000Z'::timestamp(3), NULL, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'CRM Sandbox Configuration', NULL, 'DONE', NULL, '2026-05-07T00:00:00.000Z'::timestamp(3), 2, 16, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'CRM Sandbox Testing', NULL, 'DONE', NULL, '2026-05-11T00:00:00.000Z'::timestamp(3), 1, 17, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'CRM Production Configuration or Migration', NULL, 'DONE', NULL, '2026-05-13T00:00:00.000Z'::timestamp(3), 2, 18, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'CRM Production Testing', NULL, 'DONE', NULL, '2026-05-15T00:00:00.000Z'::timestamp(3), 1, 19, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'DONE', NULL, '2026-05-19T00:00:00.000Z'::timestamp(3), 2, 20, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Triggers', NULL, 'DONE', NULL, '2026-05-19T00:00:00.000Z'::timestamp(3), 1, 21, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Run Pre-launch checkpoint', NULL, 'DONE', NULL, '2026-05-21T00:00:00.000Z'::timestamp(3), 1, 22, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Training Consultation', NULL, 'DONE', NULL, '2026-05-21T00:00:00.000Z'::timestamp(3), 1.5, 23, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-05-21T00:00:00.000Z'::timestamp(3), 0.25, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-06-30T00:00:00.000Z'::timestamp(3), 4, 25, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-07-10T00:00:00.000Z'::timestamp(3), 2, 26, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Advanced Topics', NULL, 'TODO', NULL, '2026-07-10T00:00:00.000Z'::timestamp(3), 2, 27, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Update CRM', NULL, 'TODO', NULL, '2026-06-11T00:00:00.000Z'::timestamp(3), 0.5, 28, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Conduct Transition call with Outreach account team', NULL, 'TODO', NULL, '2026-06-04T00:00:00.000Z'::timestamp(3), 0.5, 29, NULL, now(), now());
END $p$;

-- Lumistry | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Lumistry | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Lumistry';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Lumistry | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-02T00:00:00.000Z'::timestamp(3), '2026-08-17T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-07-02T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'DONE', NULL, '2026-07-31T00:00:00.000Z'::timestamp(3), 10, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'DONE', NULL, '2026-07-23T00:00:00.000Z'::timestamp(3), 2, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'DONE', NULL, '2026-07-30T00:00:00.000Z'::timestamp(3), 2, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)  (26 tasks, 19.5h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Lumistry';
  v_pt := NULL;
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage + Starter Add-On (1-19)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', v_c, v_pt, v_o, 'ACTIVE', '2026-06-22T00:00:00.000Z'::timestamp(3), '2026-08-17T00:00:00.000Z'::timestamp(3), 19.5, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Content Strategy', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Data Workflow  & System Configuration', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Add-Ons', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Pre-Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Complete Project', 7);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-22T00:00:00.000Z'::timestamp(3), 0.5, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'DONE', NULL, NULL, NULL, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule Kickoff', NULL, 'DONE', NULL, NULL, NULL, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-22T00:00:00.000Z'::timestamp(3), 1.25, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct workflow interviews', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-23T00:00:00.000Z'::timestamp(3), 1, 6, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Summarize Workflow', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-23T00:00:00.000Z'::timestamp(3), 0.5, 7, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-24T00:00:00.000Z'::timestamp(3), 0.75, 8, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Workshop', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-25T00:00:00.000Z'::timestamp(3), 1, 9, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Configuration', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-25T00:00:00.000Z'::timestamp(3), 1, 10, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Testing', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-26T00:00:00.000Z'::timestamp(3), 1, 11, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-26T00:00:00.000Z'::timestamp(3), 1, 12, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Triggers', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-06T00:00:00.000Z'::timestamp(3), 0.75, 13, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Amplify', 'Connect Outreach and Meeting Provider
    Review Kaia Settings
    Develop Content Cards
    Develop Coach Cards
    Create Playlists', 'TODO', NULL, '2026-07-14T00:00:00.000Z'::timestamp(3), 1.5, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), NULL, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Run Pre-launch checkpoint', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-01T00:00:00.000Z'::timestamp(3), 0.75, 16, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Training Consultation', NULL, 'TODO', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), 1.5, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), 0.25, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-07-27T00:00:00.000Z'::timestamp(3), 2, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-08-03T00:00:00.000Z'::timestamp(3), 1, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Engage Advanced Topics', NULL, 'TODO', NULL, '2026-08-03T00:00:00.000Z'::timestamp(3), 1, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Amplify User Training', NULL, 'TODO', NULL, '2026-08-10T00:00:00.000Z'::timestamp(3), 1, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Amplify Advanced Topics', NULL, 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 1, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Update CRM', NULL, 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 0.5, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Introduce Outreach account team', NULL, 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 0.25, 25, NULL, now(), now());
END $p$;

-- Muck Rack | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Muck Rack | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Muck Rack';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Muck Rack | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-17T00:00:00.000Z'::timestamp(3), '2026-09-01T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-07-17T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Workflow Discovery', NULL, 'DONE', NULL, '2026-07-31T00:00:00.000Z'::timestamp(3), 10, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'DONE', NULL, '2026-08-07T00:00:00.000Z'::timestamp(3), 2, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-14T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-08-28T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-01T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- NoRedInk | Amplify Starter  (8 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'NoRedInk | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'NoRedInk';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'NoRedInk | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-08T00:00:00.000Z'::timestamp(3), '2026-08-07T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', 'Shareable link: https://us06web.zoom.us/rec/share/nn1Sy5dCUHIPjTZlHC1CFTNBddsQotjXGlCd6RdweOzFT_o3nYnbldweHiRYxj6O.QCwBGgfWVR4jbLj5
Passcode: &PU9G3#X', 'DONE', NULL, '2026-07-09T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Workflow/Use Case Discovery', NULL, 'DONE', NULL, NULL, NULL, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Workflow/Use Case Discovery Continued', NULL, 'TODO', NULL, '2026-08-06T00:00:00.000Z'::timestamp(3), NULL, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), 10, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-07-15T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-07-22T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), 2, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-08-07T00:00:00.000Z'::timestamp(3), 2, 7, NULL, now(), now());
END $p$;

-- Openspace | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Openspace | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Openspace';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Openspace | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-08-03T00:00:00.000Z'::timestamp(3), '2026-09-16T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-08-03T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-08-24T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-16T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Panther Labs, Inc | Amplify Starter  (6 tasks, 18h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Panther Labs, Inc | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Panther Labs, Inc';
  v_pt := NULL;
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Panther Labs, Inc | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-08-03T00:00:00.000Z'::timestamp(3), '2026-09-16T00:00:00.000Z'::timestamp(3), 18, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', NULL, '2026-08-03T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 8, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-08-24T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-16T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Patient Accounting Service Center, LLC dba GetixHealth | Amplify Starter  (6 tasks, 18h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Patient Accounting Service Center, LLC dba GetixHealth | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Patient Accounting Service Center, LLC dba GetixHealth';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Patient Accounting Service Center, LLC dba GetixHealth | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-06-01T00:00:00.000Z'::timestamp(3), '2026-07-15T00:00:00.000Z'::timestamp(3), 18, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-06-01T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-06-15T00:00:00.000Z'::timestamp(3), 8, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-06-22T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-06-29T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-07-13T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-07-15T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Pindrop | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Pindrop | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Pindrop';
  v_pt := NULL;
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Pindrop | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-08-18T00:00:00.000Z'::timestamp(3), '2026-10-01T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', NULL, '2026-08-18T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-09-01T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-09-08T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-09-15T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-10-01T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Postscript | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Postscript | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Postscript';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Postscript | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-05-25T00:00:00.000Z'::timestamp(3), '2026-07-08T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-05-25T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-06-08T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-06-15T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-06-22T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-07-06T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- PureEHS Outreach Implementation: Engage + Starter (50-99)  (34 tasks, 56.25h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
        v_s8 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'PureEHS Outreach Implementation: Engage + Starter (50-99)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'PureEHS';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  v_t := NULL;
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'PureEHS Outreach Implementation: Engage + Starter (50-99)', v_c, v_pt, v_o, 'ACTIVE', '2026-08-27T00:00:00.000Z'::timestamp(3), '2026-10-29T00:00:00.000Z'::timestamp(3), 56.25, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Content Strategy', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Mid-project progress report', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Data Workflow  & System Configuration', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Add-Ons', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Pre-Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Launch', 7);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s8, v_p, 'Complete Project', 8);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', NULL, '2026-08-27T00:00:00.000Z'::timestamp(3), 0.5, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', NULL, '2026-09-03T00:00:00.000Z'::timestamp(3), 1.5, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Complete post kick off follow up', 'request sandbox
request 
advance task mapping 
temporary partner admin seat 
provide technical action items', 'TODO', NULL, '2026-09-03T00:00:00.000Z'::timestamp(3), 0.5, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct workflow interviews', NULL, 'TODO', NULL, '2026-09-10T00:00:00.000Z'::timestamp(3), 3, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Summarize Workflow', NULL, 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 1, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 1.5, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Workshop', NULL, 'TODO', NULL, '2026-09-17T00:00:00.000Z'::timestamp(3), 2, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'TODO', NULL, '2026-09-17T00:00:00.000Z'::timestamp(3), 1, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Seller | Consultant Sync', NULL, 'TODO', NULL, '2026-09-24T00:00:00.000Z'::timestamp(3), 0.5, 12, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-09-24T00:00:00.000Z'::timestamp(3), NULL, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Sandbox Configuration', NULL, 'TODO', NULL, '2026-09-17T00:00:00.000Z'::timestamp(3), 2, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Sandbox Testing', NULL, 'TODO', NULL, '2026-09-21T00:00:00.000Z'::timestamp(3), 1, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Production Configuration or Migration', NULL, 'TODO', NULL, '2026-09-23T00:00:00.000Z'::timestamp(3), 2, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Production Testing', NULL, 'TODO', NULL, '2026-09-25T00:00:00.000Z'::timestamp(3), 1, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), 2, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Triggers', NULL, 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), 1, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Meet', 'Connect Outreach and Meeting Provider
    Review Kaia Settings
    Develop Content Cards
    Develop Coach Cards
    Create Playlists', 'TODO', NULL, '2026-09-29T00:00:00.000Z'::timestamp(3), 3, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Deal', 'Map required fields: 
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent.
    Enable Forecast and Pipeline Management
    Upload Quotas', 'TODO', NULL, '2026-10-08T00:00:00.000Z'::timestamp(3), 6, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Forecast', 'Map required fields: 
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent.
    Enable Forecast and Pipeline Management
    Upload Quotas
    Build Metrics
    Test accuracy', 'TODO', NULL, '2026-10-08T00:00:00.000Z'::timestamp(3), 8, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Run Pre-launch checkpoint', NULL, 'TODO', NULL, '2026-10-01T00:00:00.000Z'::timestamp(3), 1, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Training Consultation', NULL, 'TODO', NULL, '2026-10-01T00:00:00.000Z'::timestamp(3), 1.5, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-10-01T00:00:00.000Z'::timestamp(3), 0.25, 25, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-10-08T00:00:00.000Z'::timestamp(3), 4, 26, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Engage Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-10-15T00:00:00.000Z'::timestamp(3), 2, 27, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Engage Advanced Topics', NULL, 'TODO', NULL, '2026-10-22T00:00:00.000Z'::timestamp(3), 2, 28, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Add-On User Training', NULL, 'TODO', NULL, '2026-10-22T00:00:00.000Z'::timestamp(3), 4, 29, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Forecast Manager Training', NULL, 'TODO', NULL, '2026-10-22T00:00:00.000Z'::timestamp(3), 1, 30, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Add-On Advanced Topics', NULL, 'TODO', NULL, '2026-10-29T00:00:00.000Z'::timestamp(3), 2, 31, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Update CRM', NULL, 'TODO', NULL, '2026-10-22T00:00:00.000Z'::timestamp(3), 0.5, 32, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s8, 'Conduct Transition call with Outreach account team', NULL, 'TODO', NULL, '2026-10-15T00:00:00.000Z'::timestamp(3), 0.5, 33, NULL, now(), now());
END $p$;

-- Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)  (32 tasks, 27h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Quantinuum';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage + Starter Add-On (1-19)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', v_c, v_pt, v_o, 'ACTIVE', '2026-05-20T00:00:00.000Z'::timestamp(3), '2026-07-15T00:00:00.000Z'::timestamp(3), 27, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Content Strategy', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Data Workflow  & System Configuration', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Add-Ons', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Pre-Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Complete Project', 7);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', NULL, '2026-05-20T00:00:00.000Z'::timestamp(3), 0.5, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', NULL, '2026-05-27T00:00:00.000Z'::timestamp(3), 1.25, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Scheduling Session', NULL, 'DONE', NULL, NULL, NULL, 6, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct workflow interviews', NULL, 'DONE', NULL, '2026-06-01T00:00:00.000Z'::timestamp(3), 1, 7, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Summarize Workflow', NULL, 'DONE', NULL, '2026-06-03T00:00:00.000Z'::timestamp(3), 0.5, 8, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'DONE', NULL, '2026-06-05T00:00:00.000Z'::timestamp(3), 0.75, 9, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Workshop', NULL, 'TODO', NULL, '2026-06-10T00:00:00.000Z'::timestamp(3), 1, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'TODO', NULL, '2026-06-10T00:00:00.000Z'::timestamp(3), 0.5, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Configuration', NULL, 'DONE', NULL, '2026-06-09T00:00:00.000Z'::timestamp(3), 1, 12, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Testing', NULL, 'DONE', NULL, '2026-06-16T00:00:00.000Z'::timestamp(3), 1, 13, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'DONE', NULL, '2026-06-11T00:00:00.000Z'::timestamp(3), 1, 14, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Triggers', NULL, 'TODO', NULL, '2026-06-16T00:00:00.000Z'::timestamp(3), 0.75, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Meet', 'Connect Outreach and Meeting Provider
    Review Kaia Settings
    Develop Content Cards
    Develop Coach Cards
    Create Playlists', 'DONE', NULL, '2026-06-16T00:00:00.000Z'::timestamp(3), 1.5, 16, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Deal', 'Map required fields: 
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent.
    Enable Forecast and Pipeline Management
    Upload Quotas', 'TODO', NULL, '2026-06-16T00:00:00.000Z'::timestamp(3), 2, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Forecast', 'Map required fields: 
        Opportunity name, Close date, Associated amount, Number of prospects, Account, Opportunity stage, Opportunity owner, Opportunity tags, Opportunity type, and Probability percent.
    Enable Forecast and Pipeline Management
    Upload Quotas
    Build Metrics
    Test accuracy', 'TODO', NULL, '2026-07-01T00:00:00.000Z'::timestamp(3), 5, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-06-17T00:00:00.000Z'::timestamp(3), NULL, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Run Pre-launch checkpoint', NULL, 'TODO', NULL, '2026-06-17T00:00:00.000Z'::timestamp(3), 0.75, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Training Consultation', NULL, 'TODO', NULL, '2026-06-17T00:00:00.000Z'::timestamp(3), 1.5, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-06-17T00:00:00.000Z'::timestamp(3), 0.25, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'DONE', NULL, '2026-06-24T00:00:00.000Z'::timestamp(3), 2, 23, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-07-01T00:00:00.000Z'::timestamp(3), 1, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Engage Advanced Topics', NULL, 'TODO', NULL, '2026-07-01T00:00:00.000Z'::timestamp(3), 1, 25, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Add-On User Training', NULL, 'TODO', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), 1, 26, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Add-On Advanced Topics', NULL, 'TODO', NULL, '2026-07-15T00:00:00.000Z'::timestamp(3), 1, 27, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Update CRM', NULL, 'TODO', NULL, '2026-07-15T00:00:00.000Z'::timestamp(3), 0.5, 28, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Introduce Outreach account team', NULL, 'TODO', NULL, '2026-07-15T00:00:00.000Z'::timestamp(3), 0.25, 29, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Weekly meetings', NULL, 'TODO', NULL, NULL, NULL, 30, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Weekly emails', NULL, 'TODO', NULL, NULL, NULL, 31, NULL, now(), now());
END $p$;

-- SHRM - Basic Outreach Optimization (Up to 25)  (25 tasks, 22h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'SHRM - Basic Outreach Optimization (Up to 25)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'SHRM';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;
  v_t := NULL;
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'SHRM - Basic Outreach Optimization (Up to 25)', v_c, v_pt, v_o, 'ACTIVE', '2026-07-24T00:00:00.000Z'::timestamp(3), '2026-09-11T00:00:00.000Z'::timestamp(3), 22, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Project Comms', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Kickoff', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Workflow Discovery & Design', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Content Strategy', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Data Workflow  & System Configuration', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Pre-Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Launch', 6);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Emails/Slack', NULL, 'TODO', NULL, NULL, NULL, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Calls/Meetings', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prepare for Kickoff', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-24T00:00:00.000Z'::timestamp(3), 0.5, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Run Kickoff', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-31T00:00:00.000Z'::timestamp(3), 1.5, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Post-Kickoff Follow Up', NULL, 'DONE', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-31T00:00:00.000Z'::timestamp(3), 0.5, 4, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Get Access to Customer Instance', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-07-31T00:00:00.000Z'::timestamp(3), NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Conduct workflow interviews', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-07T00:00:00.000Z'::timestamp(3), 2, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Summarize workflow', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-14T00:00:00.000Z'::timestamp(3), 1.5, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Audit Current Content', 'Sequences
    Templates/Snippets
    Meeting Types
    Content Governance/Settings', 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-11T00:00:00.000Z'::timestamp(3), 1.5, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Review', 'Document recommendations
        Content Clean up
            Collection/tag for clean up
        Content Gap/missing requirements
        Settings enhancements
    Guidance on Content Committee
        Intake form
        Schedule of review 
        Permissions', 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-14T00:00:00.000Z'::timestamp(3), 2, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Workshop (if needed)', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-14T00:00:00.000Z'::timestamp(3), 2, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Performance Pulse Intro', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-17T00:00:00.000Z'::timestamp(3), 0.5, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Plugin Audit', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-14T00:00:00.000Z'::timestamp(3), 1, 12, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Provide a review of existing plugin configuration, a list of suggested enhancements, and deploy Customer approved changes', NULL, 'TODO', NULL, NULL, NULL, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Consult on best practice recommendations', NULL, 'TODO', NULL, NULL, NULL, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Facilitate final plugin testing where needed', NULL, 'TODO', NULL, NULL, NULL, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Outreach Governance Audit', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-14T00:00:00.000Z'::timestamp(3), 1, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Review, audit, and document applicable end-user workflows', NULL, 'TODO', NULL, NULL, NULL, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Review governance settings, providing best practice recommendations based on long-term scalability and maintenance needs', NULL, 'TODO', NULL, NULL, NULL, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Align Customer workflows to new settings based on audit findings', NULL, 'TODO', NULL, NULL, NULL, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Assess current trigger usage and implement recommended automation where advisable', NULL, 'TODO', NULL, NULL, NULL, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Review', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-21T00:00:00.000Z'::timestamp(3), 2, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Governance Review', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-21T00:00:00.000Z'::timestamp(3), 2, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Pre-Launch Checkpoint', NULL, 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-08-28T00:00:00.000Z'::timestamp(3), 1, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Advanced Topics', 'Up to two (2) total one-hour Office Hour sessions to be completed within two (2)  weeks post user launch
    All Office Hour sessions shall be limited to no more than 25 users per session', 'TODO', (select id from onespace."User" where lower(email)='marcus@revoptics.co' limit 1), '2026-09-11T00:00:00.000Z'::timestamp(3), 3, 24, NULL, now(), now());
END $p$;

-- Sikich | Amplify Starter  (15 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Sikich | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Sikich';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  v_t := NULL;
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Sikich | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-08-26T00:00:00.000Z'::timestamp(3), '2026-10-09T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Engage Implementation', 3);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-08-26T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Workflow', NULL, 'DONE', NULL, NULL, NULL, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-09-09T00:00:00.000Z'::timestamp(3), 10, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-09-16T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-09-23T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-10-07T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-10-09T00:00:00.000Z'::timestamp(3), 2, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Kickoff', NULL, 'DONE', NULL, NULL, NULL, 7, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Workflow Interview', NULL, 'DONE', NULL, NULL, NULL, 8, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Strategy', NULL, 'TODO', NULL, NULL, NULL, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Workshop', NULL, 'TODO', NULL, NULL, NULL, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Part 1 & 2', NULL, 'TODO', NULL, NULL, NULL, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Governance', NULL, 'TODO', NULL, NULL, NULL, 12, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Pre-Launch', NULL, 'TODO', NULL, NULL, NULL, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Training Hours', NULL, 'TODO', NULL, NULL, NULL, 14, NULL, now(), now());
END $p$;

-- Simpler Postage, Inc | Amplify Starter  (8 tasks, 17h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Simpler Postage, Inc | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Simpler Postage, Inc';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Simpler Postage, Inc | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-02T00:00:00.000Z'::timestamp(3), '2026-08-28T00:00:00.000Z'::timestamp(3), 17, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting - Amplify', 'https://us06web.zoom.us/rec/share/ONXJtuHWg1DKvdz_XrioptZ0kXAfBvCsJ3VegM0Tbh-D3FD3F6TaRcpwjmEshRUC.u6Rit1mSI7vpqGIY
Passcode: !+UjUS6$', 'DONE', NULL, '2026-07-02T00:00:00.000Z'::timestamp(3), 1, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Workflow /Use Case Discovery', 'https://app.apollo.io/#/conversation-shares/6a4ebb2d682dcd00181fb459-6a4eee7b9b7cf20014004b63', 'DONE', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), 1, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Workflow/Use Case Discovery Part 2', NULL, 'DONE', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), 1, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt(s) Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-08-04T00:00:00.000Z'::timestamp(3), 6, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt(s) Testing', NULL, 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-12T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-08-26T00:00:00.000Z'::timestamp(3), 2, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-08-28T00:00:00.000Z'::timestamp(3), 2, 7, NULL, now(), now());
END $p$;

-- Spark Hire, Inc. | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Spark Hire, Inc. | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Spark Hire, Inc.';
  v_pt := NULL;
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Spark Hire, Inc. | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-08T00:00:00.000Z'::timestamp(3), '2026-08-21T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-07-22T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-07-29T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-08-19T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-08-21T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Specright | Amplify Starter  (6 tasks, 19h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Specright | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Specright';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Specright | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-06-03T00:00:00.000Z'::timestamp(3), '2026-07-10T00:00:00.000Z'::timestamp(3), 19, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', NULL, '2026-06-03T00:00:00.000Z'::timestamp(3), 1, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-06-10T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-06-17T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-06-24T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-07-08T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-07-10T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- State Affairs | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'State Affairs | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'State Affairs';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'State Affairs | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-22T00:00:00.000Z'::timestamp(3), '2026-09-04T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-07-22T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'DONE', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 10, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'DONE', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 2, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-19T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-02T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-04T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- State Affairs | Outreach Implementation: Engage (1-19)  (26 tasks, 16h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'State Affairs | Outreach Implementation: Engage (1-19)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'State Affairs';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage (1-19)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'State Affairs | Outreach Implementation: Engage (1-19)', v_c, v_pt, v_o, 'ACTIVE', '2026-07-23T00:00:00.000Z'::timestamp(3), '2026-09-04T00:00:00.000Z'::timestamp(3), 16, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Project Comms', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Workflow Discovery & Design', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Content Strategy', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Data Workflow  & System Configuration', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Pre-Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Complete Project', 7);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Email/Slack', NULL, 'TODO', NULL, NULL, NULL, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Weekly Calls/Meetings', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', NULL, '2026-07-23T00:00:00.000Z'::timestamp(3), 0.5, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', NULL, '2026-07-30T00:00:00.000Z'::timestamp(3), 1.25, 5, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Conduct workflow interviews', NULL, 'DONE', NULL, '2026-08-04T00:00:00.000Z'::timestamp(3), 1, 8, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Summarize Workflow', NULL, 'TODO', NULL, '2026-08-06T00:00:00.000Z'::timestamp(3), 0.5, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'TODO', NULL, '2026-08-10T00:00:00.000Z'::timestamp(3), 0.75, 10, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Workshop', NULL, 'TODO', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 1, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'TODO', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 0.5, 12, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Configuration', NULL, 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 1, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'CRM Testing', NULL, 'TODO', NULL, '2026-08-19T00:00:00.000Z'::timestamp(3), 1, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'TODO', NULL, '2026-08-19T00:00:00.000Z'::timestamp(3), 1, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Triggers', NULL, 'TODO', NULL, '2026-08-19T00:00:00.000Z'::timestamp(3), 0.75, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Introduction to RevOptics Leadership', NULL, 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), NULL, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Run Pre-launch checkpoint', NULL, 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 0.75, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Training Consultation', NULL, 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 1, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 0.25, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-08-27T00:00:00.000Z'::timestamp(3), 2, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-09-03T00:00:00.000Z'::timestamp(3), 1, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Advanced Topics', NULL, 'TODO', NULL, '2026-09-03T00:00:00.000Z'::timestamp(3), 1, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Update CRM', NULL, 'TODO', NULL, '2026-09-04T00:00:00.000Z'::timestamp(3), 0.5, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Introduce Outreach account team', NULL, 'TODO', NULL, '2026-09-04T00:00:00.000Z'::timestamp(3), 0.25, 25, NULL, now(), now());
END $p$;

-- SuperOps.ai | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'SuperOps.ai | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'SuperOps.ai';
  v_pt := NULL;
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'SuperOps.ai | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-06-01T00:00:00.000Z'::timestamp(3), '2026-07-15T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', NULL, '2026-06-01T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-06-15T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-06-22T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-06-29T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-07-13T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-07-15T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)  (23 tasks, 0h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Suvoda';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Optimization (Up to 100)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', v_c, v_pt, v_o, 'ACTIVE', NULL, NULL, NULL, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Content Strategy', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Data Workflow  & System Configuration', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Pre-Launch', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Launch', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Communication', 5);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Develop and manage primary project plan in conjunction with Customer', NULL, 'DONE', NULL, NULL, NULL, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule and facilitate meetings with key stakeholders and internal Customer teams', NULL, 'DONE', NULL, NULL, NULL, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Report weekly on key project delays or risks', NULL, 'DONE', NULL, NULL, NULL, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Help ensure project related follow up items are tracked and resolved', NULL, 'TODO', NULL, NULL, NULL, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Up to four (4) content workshop sessions', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct gap analysis based on new Content Framework and existing “live” content', NULL, 'TODO', NULL, NULL, NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Advise on deployment strategy for net-new content needs and development', NULL, 'TODO', NULL, NULL, NULL, 6, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Audit of content-related settings including schedules, rulesets, and collections', NULL, 'TODO', NULL, NULL, NULL, 7, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Develop and implement methodology for long-term content maintenance', NULL, 'TODO', NULL, NULL, NULL, 8, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Identify opportunities to utilize best practices that reinforce optimal Customer outcomes', NULL, 'TODO', NULL, NULL, NULL, 9, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'CRM Plugin Audit', NULL, 'DONE', NULL, NULL, NULL, 10, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Provide a review of existing plugin configuration, a list of suggested enhancements, and deploy Customer approved changes', NULL, 'TODO', NULL, NULL, NULL, 11, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Consult on best practice recommendations', NULL, 'TODO', NULL, NULL, NULL, 12, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Facilitate final plugin testing where needed', NULL, 'TODO', NULL, NULL, NULL, 13, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Outreach Governance Audit', NULL, 'DONE', NULL, NULL, NULL, 14, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Review, audit, and document applicable end-user workflows', NULL, 'TODO', NULL, NULL, NULL, 15, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Review governance settings, providing best practice recommendations based on long-term scalability and maintenance needs', NULL, 'TODO', NULL, NULL, NULL, 16, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Align Customer workflows to new settings based on audit findings', NULL, 'TODO', NULL, NULL, NULL, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Assess current trigger usage and implement recommended automation where advisable', NULL, 'TODO', NULL, NULL, NULL, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Review content, Success Plan Templates, KAIA Cards, and user settings', NULL, 'TODO', NULL, NULL, NULL, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Office Hours', 'Up to four (4) total one-hour Office Hour sessions to be completed within two (2)  weeks post user launch
    All Office Hour sessions shall be limited to no more than 25 users per session', 'TODO', NULL, NULL, NULL, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Weekly Meetings', NULL, 'TODO', NULL, NULL, NULL, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Weekly emails & Ad-Hoc meetings', NULL, 'TODO', NULL, NULL, NULL, 22, NULL, now(), now());
END $p$;

-- TTEC | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'TTEC | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'TTEC';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'TTEC | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-30T00:00:00.000Z'::timestamp(3), '2026-09-14T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-07-30T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-27T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-10T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Ushur | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Ushur | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Ushur';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Ushur | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-30T00:00:00.000Z'::timestamp(3), '2026-09-14T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', NULL, '2026-07-30T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-08-20T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-27T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-10T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- Vertiv | Amplify Starter  (7 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Vertiv | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Vertiv';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Vertiv | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-16T00:00:00.000Z'::timestamp(3), '2026-08-31T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-07-16T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Reset with AE', NULL, 'DONE', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), NULL, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'DONE', NULL, '2026-07-30T00:00:00.000Z'::timestamp(3), 10, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-08-06T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-08-27T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 2, 6, NULL, now(), now());
END $p$;

-- Very Good Security (VGS) | Amplify Starter  (6 tasks, 20h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Very Good Security (VGS) | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'Very Good Security (VGS)';
  v_pt := NULL;
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'Very Good Security (VGS) | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-20T00:00:00.000Z'::timestamp(3), '2026-09-02T00:00:00.000Z'::timestamp(3), 20, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'TODO', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), 2, 0, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'TODO', NULL, '2026-08-03T00:00:00.000Z'::timestamp(3), 10, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'TODO', NULL, '2026-08-10T00:00:00.000Z'::timestamp(3), 2, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 2, 3, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-02T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- XSE Group | Amplify Starter  (6 tasks, 13h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'XSE Group | Amplify Starter') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'XSE Group';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Amplify Starter';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'XSE Group | Amplify Starter', v_c, v_pt, v_o, 'ACTIVE', '2026-07-20T00:00:00.000Z'::timestamp(3), '2026-09-16T00:00:00.000Z'::timestamp(3), 13, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Amplify Kick Off', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Amplify Configuration', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Amplify Evaluation', 2);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Kick Off Meeting', NULL, 'DONE', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), 2, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Build Out (Meetings and Work)', NULL, 'DONE', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 5, 1, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Testing', NULL, 'DONE', NULL, '2026-08-24T00:00:00.000Z'::timestamp(3), 1, 2, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Prompt Launching', NULL, 'DONE', NULL, '2026-08-31T00:00:00.000Z'::timestamp(3), 1, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Prompt Evaluation and Feedback', NULL, 'TODO', NULL, '2026-09-14T00:00:00.000Z'::timestamp(3), 2, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'External Launch & Training', NULL, 'TODO', NULL, '2026-09-16T00:00:00.000Z'::timestamp(3), 2, 5, NULL, now(), now());
END $p$;

-- XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)  (26 tasks, 18h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
        v_s7 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'XSE Group';
  v_pt := NULL;
  v_o := NULL;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage + Starter Add-On (1-19)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', v_c, v_pt, v_o, 'ACTIVE', '2026-06-24T00:00:00.000Z'::timestamp(3), '2026-08-19T00:00:00.000Z'::timestamp(3), 18, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Content Strategy', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Data Workflow  & System Configuration', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Add-Ons', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Pre-Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Launch', 6);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s7, v_p, 'Complete Project', 7);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-24T00:00:00.000Z'::timestamp(3), 0.5, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule Kickoff', NULL, 'TODO', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), NULL, NULL, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-06-30T00:00:00.000Z'::timestamp(3), 1.25, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct workflow interviews', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-01T00:00:00.000Z'::timestamp(3), 1, 6, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Summarize Workflow', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-01T00:00:00.000Z'::timestamp(3), 0.5, 7, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-08T00:00:00.000Z'::timestamp(3), 0.75, 8, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Workshop', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-13T00:00:00.000Z'::timestamp(3), 1, 9, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Configuration', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-09T00:00:00.000Z'::timestamp(3), 1, 10, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Testing', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-13T00:00:00.000Z'::timestamp(3), 1, 11, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-16T00:00:00.000Z'::timestamp(3), 1, 12, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Triggers', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-17T00:00:00.000Z'::timestamp(3), 0.75, 13, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Amplify', 'Connect Outreach and Meeting Provider
    Review Kaia Settings
    Develop Content Cards
    Develop Coach Cards
    Create Playlists', 'TODO', NULL, '2026-07-20T00:00:00.000Z'::timestamp(3), NULL, 14, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Introduction to RevOptics Leadership', NULL, 'DONE', NULL, '2026-07-22T00:00:00.000Z'::timestamp(3), NULL, 15, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Run Pre-launch checkpoint', NULL, 'DONE', NULL, '2026-07-23T00:00:00.000Z'::timestamp(3), 0.75, 16, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Training Consultation', NULL, 'TODO', NULL, '2026-07-22T00:00:00.000Z'::timestamp(3), 1.5, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-07-22T00:00:00.000Z'::timestamp(3), 0.25, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-07-29T00:00:00.000Z'::timestamp(3), 2, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), 1, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Engage Advanced Topics', NULL, 'TODO', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), 1, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Add-On User Training', NULL, 'TODO', NULL, '2026-08-12T00:00:00.000Z'::timestamp(3), 1, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Add-On Advanced Topics', NULL, 'TODO', NULL, '2026-08-19T00:00:00.000Z'::timestamp(3), 1, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Update CRM', NULL, 'TODO', NULL, '2026-08-19T00:00:00.000Z'::timestamp(3), 0.5, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s7, 'Introduce Outreach account team', NULL, 'TODO', NULL, '2026-08-19T00:00:00.000Z'::timestamp(3), 0.25, 25, NULL, now(), now());
END $p$;

-- LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)  (27 tasks, 18.5h)
DO $p$
DECLARE v_p text := gen_random_uuid()::text; v_c text; v_t text; v_pt text; v_o text;
        v_s0 text := gen_random_uuid()::text;
        v_s1 text := gen_random_uuid()::text;
        v_s2 text := gen_random_uuid()::text;
        v_s3 text := gen_random_uuid()::text;
        v_s4 text := gen_random_uuid()::text;
        v_s5 text := gen_random_uuid()::text;
        v_s6 text := gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)') THEN RETURN; END IF;
  SELECT id INTO v_c FROM onespace."Client" WHERE name = 'LuxGive';
  SELECT id INTO v_pt FROM onespace."Partner" WHERE name = 'Outreach';
  SELECT id INTO v_o FROM onespace."User" WHERE lower(email) = 'aaron@revoptics.co' LIMIT 1;
  SELECT id INTO v_t FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation: Engage + Starter Add-On (1-19) (variant 2)';
  INSERT INTO onespace."Project" (id,name,"clientId","partnerId","ownerId",status,"startDate","dueDate","budgetHours",billable,"templateId","createdAt","updatedAt")
  VALUES (v_p, 'LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', v_c, v_pt, v_o, 'ACTIVE', '2026-07-07T00:00:00.000Z'::timestamp(3), '2026-08-26T00:00:00.000Z'::timestamp(3), 18.5, true, v_t, now(), now());
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Kickoff (Initial Planning & Ongoing Project Management Activities)', 0);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Workflow Discovery & Design', 1);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Content Strategy', 2);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Data Workflow  & System Configuration', 3);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Pre-Launch', 4);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s5, v_p, 'Launch', 5);
  INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s6, v_p, 'Complete Project', 6);
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Prepare for Kickoff', 'Review SFCD Opportunity
Create Kickoff Deck', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-07T00:00:00.000Z'::timestamp(3), 0.5, 0, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Conduct Project review w/ outreach sales person / RevOptics Salesperson', NULL, 'TODO', NULL, NULL, NULL, 1, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Schedule Kickoff', NULL, 'TODO', NULL, NULL, NULL, 2, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Run Kickoff', 'Develop Project Plan 
    Schedule Milestone meetings
    Define Success Metrics', 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-07T00:00:00.000Z'::timestamp(3), 1.25, 3, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Load Success Metrics Into SFDC', NULL, 'TODO', NULL, NULL, NULL, 4, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s0, 'Add Contact Roles into SFDC', NULL, 'TODO', NULL, NULL, NULL, 5, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Conduct workflow interviews', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-09T00:00:00.000Z'::timestamp(3), 1, 6, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s1, 'Summarize Workflow', NULL, 'DONE', (select id from onespace."User" where lower(email)='aaron@revoptics.co' limit 1), '2026-07-09T00:00:00.000Z'::timestamp(3), 0.5, 7, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Strategy Call', 'Share content best practices 
Define content requirements for project', 'DONE', NULL, '2026-07-14T00:00:00.000Z'::timestamp(3), 0.75, 8, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Workshop', NULL, 'DONE', NULL, '2026-07-17T00:00:00.000Z'::timestamp(3), 1, 9, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s2, 'Content Settings Call', 'Rule Sets schedule 
Collections 
Throttling
general sequence settings', 'DONE', NULL, '2026-07-22T00:00:00.000Z'::timestamp(3), 0.5, 10, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Configuration', NULL, 'DONE', NULL, '2026-07-15T00:00:00.000Z'::timestamp(3), 1, 11, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'CRM Testing', NULL, 'DONE', NULL, '2026-07-16T00:00:00.000Z'::timestamp(3), 1, 12, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Governance Configuration', 'profiles
org info
teams
calendar configuration 
meeting provider
layouts
voice', 'DONE', NULL, '2026-07-28T00:00:00.000Z'::timestamp(3), 1, 13, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s3, 'Triggers', NULL, 'DONE', NULL, '2026-07-28T00:00:00.000Z'::timestamp(3), 0.75, 14, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Introduction to RevOptics Leadership', NULL, 'DONE', NULL, '2026-07-28T00:00:00.000Z'::timestamp(3), NULL, 15, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Run Pre-launch checkpoint', NULL, 'DONE', NULL, '2026-08-05T00:00:00.000Z'::timestamp(3), 0.75, 16, now(), now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Training Consultation', NULL, 'TODO', NULL, '2026-08-13T00:00:00.000Z'::timestamp(3), 1.5, 17, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s4, 'Send user configuration instructions / account set up', NULL, 'TODO', NULL, '2026-07-29T00:00:00.000Z'::timestamp(3), 0.25, 18, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Engage User Training', 'Customer training workshops, inclusive of:
        Up to  one (1) end user training workshop. End users will need to attend two (2) separate up to 1-hr training sessions to complete the end user training workshop
        Up to one (1) 1-hr manager workshop
    All training sessions shall be limited to no more than 19 users per session', 'TODO', NULL, '2026-08-17T00:00:00.000Z'::timestamp(3), 2, 19, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Manager Training', 'To be conducted one week post user training', 'TODO', NULL, NULL, 1, 20, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Engage Advanced Topics', NULL, 'TODO', NULL, NULL, 1, 21, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Add-On User Training', NULL, 'TODO', NULL, NULL, 1, 22, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s5, 'Add-On Advanced Topics', NULL, 'TODO', NULL, NULL, 1, 23, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Update CRM', NULL, 'TODO', NULL, '2026-08-26T00:00:00.000Z'::timestamp(3), 0.5, 24, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Introduce Outreach account team', NULL, 'TODO', NULL, '2026-08-26T00:00:00.000Z'::timestamp(3), 0.25, 25, NULL, now(), now());
  INSERT INTO onespace."Task" (id,"projectId","sectionId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
  VALUES (gen_random_uuid()::text, v_p, v_s6, 'Troubleshooting call', NULL, 'TODO', NULL, NULL, NULL, 26, NULL, now(), now());
END $p$;

COMMIT;

-- What landed:
select c.name as client, p.name as project, p."budgetHours" as est_hours,
       (select count(*) from onespace."Task" t where t."projectId"=p.id) as tasks,
       (select count(*) from onespace."Task" t where t."projectId"=p.id and t."assigneeId" is null) as unassigned,
       pt.name as partner, u.name as owner, tp.name as template
from onespace."Project" p
  left join onespace."Client" c on c.id=p."clientId"
  left join onespace."Partner" pt on pt.id=p."partnerId"
  left join onespace."User" u on u.id=p."ownerId"
  left join onespace."ProjectTemplate" tp on tp.id=p."templateId"
order by c.name, p.name;
