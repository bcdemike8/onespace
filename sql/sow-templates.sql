-- RevOptics implementation templates, built from the eight signed SOWs
-- =====================================================================
-- Creates eight project templates under Templates, which then appear in the
-- dropdown on New project. Each one carries the SOW's phases, its steps and
-- subtasks, an hour estimate per step summing exactly to the SOW's contracted
-- hours, and a due-date offset counted forward from whatever start date you
-- pick when you create the project.
--
-- Safe to re-run: it deletes and rebuilds only these eight templates by name.
-- Projects already created from a template keep their tasks — the link is by
-- id and nothing cascades into a live project.

BEGIN;

-- ----------------------------------------------------------------------
-- Outreach Implementation — Amplify Core (1-19 seats)

DO $$
DECLARE
  v_t text; v_s text; v_p text;
BEGIN
  DELETE FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation — Amplify Core (1-19 seats)';
  v_t := gen_random_uuid()::text;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_t, 'Outreach Implementation — Amplify Core (1-19 seats)', 'From the signed SOW: 28 hours over 7 weeks, up to 19 seats, 3 user groups, 1 Amplify use case. In scope: Engage, Amplify.', now(), now());

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Kickoff', 0);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Prepare for kickoff', 1, 0.5, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Conduct project review with the Outreach / RevOptics salesperson', 1, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Schedule the kickoff', 1, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Confirm the platform capabilities in scope', 1, NULL, 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the kickoff', 2, 0.75, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Load success metrics into SFDC', 2, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Add contact roles into SFDC', 2, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Identify project, executive and technical sponsors', 2, NULL, 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Build and share the project plan', 3, 0.25, 8);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Weekly status report', 4, 0.5, 9);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Workflow Discovery & AI Design', 1);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Engage (3 user groups)', 6, 1.25, 10);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm Amplify use case details and data requirements (1 use case)', 9, 0.75, 11);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Summarise workflows and share back', 11, 0.5, 12);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Content Strategy', 2);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content strategy call', 13, 0.75, 13);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content workshop', 15, 1.0, 14);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content settings call', 17, 0.25, 15);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify — align the AI agent content framework', 19, 0.75, 16);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Data Workflow & System Configuration', 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin configuration', 20, 1.25, 17);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin testing', 22, 0.75, 18);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Governance configuration', 23, 0.75, 19);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Triggers and automation', 24, 0.5, 20);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'SSO and Branded URL setup', 26, 0.5, 21);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Data enrichment review — signals and personalization', 27, 0.5, 22);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Amplify Build', 4);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — prompt build out', 29, 3.25, 23);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 29, NULL, 24);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 29, NULL, 25);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — prompt testing', 32, 1.5, 26);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 32, NULL, 27);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — prompt launch', 35, 0.5, 28);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — evaluation and feedback', 37, 1.0, 29);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Pre-Launch', 5);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the pre-launch checkpoint', 38, 0.25, 30);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Review content and user settings', 39, 0.5, 31);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Training consultation', 41, 0.5, 32);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Send user configuration and account set-up instructions', 42, 0.25, 33);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm the go-live checklist with the customer', 43, 0.25, 34);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Launch', 6);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 1 of 2, session 1 of 2 (max 19)', 44, 1.0, 35);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 1 of 2, session 2 of 2 (max 19)', 44, 1.0, 36);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 2 of 2, session 1 of 2 (max 19)', 45, 1.0, 37);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 2 of 2, session 2 of 2 (max 19)', 45, 1.0, 38);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop (1 hr, max 19)', 46, 1.0, 39);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify user training', 47, 0.75, 40);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 1 of 2 (1 hr, max 19)', 47, 1.0, 41);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 2 of 2 (1 hr, max 19)', 48, 1.0, 42);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Complete Project', 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Obtain project sign-off at go-live', 48, 0.25, 43);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Update the CRM', 49, 0.25, 44);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Introduce the Outreach account team', 49, 0.25, 45);
END $$;

-- ----------------------------------------------------------------------
-- Outreach Implementation — Amplify Core (20-49 seats)

DO $$
DECLARE
  v_t text; v_s text; v_p text;
BEGIN
  DELETE FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation — Amplify Core (20-49 seats)';
  v_t := gen_random_uuid()::text;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_t, 'Outreach Implementation — Amplify Core (20-49 seats)', 'From the signed SOW: 71 hours over 8 weeks, up to 49 seats, 4 user groups, 1 Amplify use case. In scope: Engage, Amplify.', now(), now());

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Kickoff', 0);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Prepare for kickoff', 1, 1.5, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Conduct project review with the Outreach / RevOptics salesperson', 1, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Schedule the kickoff', 1, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Confirm the platform capabilities in scope', 1, NULL, 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the kickoff', 2, 2.25, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Load success metrics into SFDC', 2, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Add contact roles into SFDC', 2, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Identify project, executive and technical sponsors', 2, NULL, 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Build and share the project plan', 3, 0.75, 8);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Weekly status report', 4, 1.5, 9);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Workflow Discovery & AI Design', 1);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Engage (4 user groups)', 7, 3.0, 10);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm Amplify use case details and data requirements (1 use case)', 9, 2.5, 11);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Summarise workflows and share back', 12, 1.25, 12);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Content Strategy', 2);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content strategy call', 14, 2.25, 13);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content workshop', 16, 3.25, 14);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content settings call', 19, 1.0, 15);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify — align the AI agent content framework', 21, 2.25, 16);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Data Workflow & System Configuration', 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin configuration', 23, 3.5, 17);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin testing', 24, 2.25, 18);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Governance configuration', 26, 2.25, 19);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Triggers and automation', 28, 1.25, 20);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'SSO and Branded URL setup', 29, 1.25, 21);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Data enrichment review — signals and personalization', 31, 1.25, 22);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Amplify Build', 4);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — prompt build out', 34, 9.5, 23);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 34, NULL, 24);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 34, NULL, 25);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — prompt testing', 37, 4.75, 26);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 37, NULL, 27);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — prompt launch', 40, 1.5, 28);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — evaluation and feedback', 43, 3.25, 29);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Pre-Launch', 5);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the pre-launch checkpoint', 44, 1.0, 30);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Review content and user settings', 45, 1.75, 31);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Training consultation', 47, 1.75, 32);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Send user configuration and account set-up instructions', 48, 1.0, 33);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm the go-live checklist with the customer', 49, 1.0, 34);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Launch', 6);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 1 of 2, session 1 of 2 (max 25)', 50, 1.0, 35);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 1 of 2, session 2 of 2 (max 25)', 50, 1.0, 36);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 2 of 2, session 1 of 2 (max 25)', 51, 1.0, 37);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 2 of 2, session 2 of 2 (max 25)', 51, 1.0, 38);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop 1 of 2 (1 hr, max 25)', 52, 1.0, 39);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop 2 of 2 (1 hr, max 25)', 52, 1.0, 40);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify user training', 53, 2.0, 41);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 1 of 2 (1 hr, max 25)', 53, 1.0, 42);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 2 of 2 (1 hr, max 25)', 54, 1.0, 43);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Complete Project', 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Obtain project sign-off at go-live', 55, 0.75, 44);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Update the CRM', 55, 0.75, 45);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Introduce the Outreach account team', 56, 0.75, 46);
END $$;

-- ----------------------------------------------------------------------
-- Outreach Implementation — Amplify Core (50-99 seats)

DO $$
DECLARE
  v_t text; v_s text; v_p text;
BEGIN
  DELETE FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation — Amplify Core (50-99 seats)';
  v_t := gen_random_uuid()::text;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_t, 'Outreach Implementation — Amplify Core (50-99 seats)', 'From the signed SOW: 117 hours over 10 weeks, up to 99 seats, 6 user groups, 2 Amplify use cases. In scope: Engage, Amplify.', now(), now());

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Kickoff', 0);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Prepare for kickoff', 2, 2.25, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Conduct project review with the Outreach / RevOptics salesperson', 2, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Schedule the kickoff', 2, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Confirm the platform capabilities in scope', 2, NULL, 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the kickoff', 3, 3.5, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Load success metrics into SFDC', 3, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Add contact roles into SFDC', 3, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Identify project, executive and technical sponsors', 3, NULL, 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Build and share the project plan', 4, 1.25, 8);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Weekly status report', 6, 2.25, 9);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Workflow Discovery & AI Design', 1);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Engage (6 user groups)', 9, 7.5, 10);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm Amplify use case details and data requirements (2 use cases)', 12, 4.0, 11);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Summarise workflows and share back', 15, 2.0, 12);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Content Strategy', 2);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content strategy call', 18, 3.5, 13);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content workshop', 21, 5.5, 14);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content settings call', 24, 1.75, 15);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify — align the AI agent content framework', 27, 3.5, 16);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Data Workflow & System Configuration', 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin configuration', 29, 5.5, 17);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin testing', 31, 3.75, 18);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Governance configuration', 33, 3.75, 19);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Triggers and automation', 35, 1.75, 20);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'SSO and Branded URL setup', 37, 1.75, 21);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Data enrichment review — signals and personalization', 39, 1.75, 22);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Amplify Build', 4);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt build out', 41, 7.75, 23);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 41, NULL, 24);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 41, NULL, 25);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt testing', 43, 3.75, 26);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 43, NULL, 27);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt launch', 44, 1.25, 28);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — evaluation and feedback', 46, 2.5, 29);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt build out', 48, 7.75, 30);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 48, NULL, 31);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 48, NULL, 32);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt testing', 49, 3.75, 33);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 49, NULL, 34);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt launch', 51, 1.25, 35);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — evaluation and feedback', 53, 2.5, 36);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Pre-Launch', 5);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the pre-launch checkpoint', 55, 1.5, 37);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Review content and user settings', 57, 3.0, 38);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Training consultation', 58, 3.0, 39);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Send user configuration and account set-up instructions', 60, 1.5, 40);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm the go-live checklist with the customer', 62, 1.5, 41);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Launch', 6);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 1 of 4, session 1 of 2 (max 25)', 62, 1.0, 42);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 1 of 4, session 2 of 2 (max 25)', 63, 1.0, 43);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 2 of 4, session 1 of 2 (max 25)', 63, 1.0, 44);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 2 of 4, session 2 of 2 (max 25)', 64, 1.0, 45);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 3 of 4, session 1 of 2 (max 25)', 64, 1.0, 46);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 3 of 4, session 2 of 2 (max 25)', 64, 1.0, 47);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 4 of 4, session 1 of 2 (max 25)', 65, 1.0, 48);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 4 of 4, session 2 of 2 (max 25)', 65, 1.0, 49);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop 1 of 2 (1 hr, max 25)', 66, 1.0, 50);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop 2 of 2 (1 hr, max 25)', 66, 1.0, 51);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify user training', 66, 3.0, 52);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 1 of 4 (1 hr, max 25)', 67, 1.0, 53);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 2 of 4 (1 hr, max 25)', 67, 1.0, 54);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 3 of 4 (1 hr, max 25)', 68, 1.0, 55);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 4 of 4 (1 hr, max 25)', 68, 1.0, 56);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Complete Project', 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Obtain project sign-off at go-live', 69, 1.25, 57);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Update the CRM', 69, 1.25, 58);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Introduce the Outreach account team', 70, 1.25, 59);
END $$;

-- ----------------------------------------------------------------------
-- Outreach Implementation — Amplify Plus (20-49 seats)

DO $$
DECLARE
  v_t text; v_s text; v_p text;
BEGIN
  DELETE FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation — Amplify Plus (20-49 seats)';
  v_t := gen_random_uuid()::text;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_t, 'Outreach Implementation — Amplify Plus (20-49 seats)', 'From the signed SOW: 99 hours over 8 weeks, up to 49 seats, 4 user groups, 2 Amplify use cases. In scope: Engage, Meet, Deal, Amplify.', now(), now());

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Kickoff', 0);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Prepare for kickoff', 1, 2.0, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Conduct project review with the Outreach / RevOptics salesperson', 1, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Schedule the kickoff', 1, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Confirm the platform capabilities in scope', 1, NULL, 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the kickoff', 2, 3.0, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Load success metrics into SFDC', 2, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Add contact roles into SFDC', 2, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Identify project, executive and technical sponsors', 2, NULL, 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Build and share the project plan', 3, 1.0, 8);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Weekly status report', 4, 2.0, 9);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Workflow Discovery & AI Design', 1);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Engage (4 user groups)', 6, 4.0, 10);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Meet', 7, 1.25, 11);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Deal', 9, 1.25, 12);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm Amplify use case details and data requirements (2 use cases)', 10, 2.75, 13);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Summarise workflows and share back', 12, 1.25, 14);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Content Strategy', 2);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content strategy call', 13, 2.0, 15);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content workshop', 15, 3.25, 16);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content settings call', 16, 1.0, 17);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Meet — content card configuration guidance', 17, 1.0, 18);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Deal — Action Plans introduction workshop', 18, 2.0, 19);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Deal — template library best practices', 20, 1.0, 20);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify — align the AI agent content framework', 21, 2.0, 21);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Data Workflow & System Configuration', 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin configuration', 23, 5.75, 22);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin testing', 24, 3.25, 23);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Governance configuration', 26, 3.25, 24);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Triggers and automation', 28, 1.75, 25);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'SSO and Branded URL setup', 29, 1.75, 26);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Data enrichment review — signals and personalization', 31, 1.75, 27);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Amplify Build', 4);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt build out', 33, 6.75, 28);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 33, NULL, 29);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 33, NULL, 30);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt testing', 34, 3.5, 31);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 34, NULL, 32);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt launch', 35, 1.25, 33);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — evaluation and feedback', 37, 2.25, 34);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt build out', 39, 6.75, 35);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 39, NULL, 36);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 39, NULL, 37);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt testing', 40, 3.5, 38);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 40, NULL, 39);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt launch', 41, 1.25, 40);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — evaluation and feedback', 43, 2.25, 41);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Pre-Launch', 5);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the pre-launch checkpoint', 44, 1.25, 42);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Review content and user settings', 45, 2.5, 43);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Training consultation', 47, 2.5, 44);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Send user configuration and account set-up instructions', 48, 1.25, 45);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm the go-live checklist with the customer', 49, 1.25, 46);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Launch', 6);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 1 of 2, session 1 of 2 (max 25)', 50, 1.0, 47);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 1 of 2, session 2 of 2 (max 25)', 50, 1.0, 48);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 2 of 2, session 1 of 2 (max 25)', 51, 1.0, 49);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 2 of 2, session 2 of 2 (max 25)', 51, 1.0, 50);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop 1 of 2 (1 hr, max 25)', 52, 1.0, 51);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop 2 of 2 (1 hr, max 25)', 52, 1.0, 52);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify user training', 53, 2.75, 53);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 1 of 2 (1 hr, max 25)', 53, 1.0, 54);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 2 of 2 (1 hr, max 25)', 54, 1.0, 55);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Complete Project', 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Obtain project sign-off at go-live', 55, 1.25, 56);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Update the CRM', 55, 1.25, 57);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Introduce the Outreach account team', 56, 1.25, 58);
END $$;

-- ----------------------------------------------------------------------
-- Outreach Implementation — Amplify Plus (50-99 seats)

DO $$
DECLARE
  v_t text; v_s text; v_p text;
BEGIN
  DELETE FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation — Amplify Plus (50-99 seats)';
  v_t := gen_random_uuid()::text;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_t, 'Outreach Implementation — Amplify Plus (50-99 seats)', 'From the signed SOW: 145 hours over 10 weeks, up to 99 seats, 6 user groups, 2 Amplify use cases. In scope: Engage, Meet, Deal, Amplify.', now(), now());

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Kickoff', 0);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Prepare for kickoff', 2, 3.0, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Conduct project review with the Outreach / RevOptics salesperson', 2, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Schedule the kickoff', 2, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Confirm the platform capabilities in scope', 2, NULL, 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the kickoff', 3, 4.5, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Load success metrics into SFDC', 3, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Add contact roles into SFDC', 3, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Identify project, executive and technical sponsors', 3, NULL, 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Build and share the project plan', 4, 1.5, 8);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Weekly status report', 6, 3.0, 9);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Workflow Discovery & AI Design', 1);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Engage (6 user groups)', 8, 6.25, 10);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Meet', 10, 2.0, 11);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Deal', 11, 2.0, 12);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm Amplify use case details and data requirements (2 use cases)', 13, 4.0, 13);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Summarise workflows and share back', 15, 2.0, 14);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Content Strategy', 2);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content strategy call', 17, 3.25, 15);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content workshop', 18, 4.75, 16);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content settings call', 20, 1.5, 17);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Meet — content card configuration guidance', 22, 1.5, 18);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Deal — Action Plans introduction workshop', 24, 3.25, 19);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Deal — template library best practices', 25, 1.5, 20);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify — align the AI agent content framework', 27, 3.25, 21);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Data Workflow & System Configuration', 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin configuration', 29, 7.5, 22);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin testing', 31, 5.0, 23);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Governance configuration', 33, 5.0, 24);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Triggers and automation', 35, 2.5, 25);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'SSO and Branded URL setup', 37, 2.5, 26);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Data enrichment review — signals and personalization', 39, 2.5, 27);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Amplify Build', 4);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt build out', 41, 10.25, 28);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 41, NULL, 29);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 41, NULL, 30);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt testing', 43, 5.25, 31);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 43, NULL, 32);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt launch', 44, 1.75, 33);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — evaluation and feedback', 46, 3.5, 34);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt build out', 48, 10.25, 35);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 48, NULL, 36);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 48, NULL, 37);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt testing', 49, 5.25, 38);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 49, NULL, 39);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt launch', 51, 1.75, 40);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — evaluation and feedback', 53, 3.5, 41);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Pre-Launch', 5);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the pre-launch checkpoint', 55, 2.0, 42);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Review content and user settings', 57, 4.0, 43);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Training consultation', 58, 4.0, 44);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Send user configuration and account set-up instructions', 60, 2.0, 45);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm the go-live checklist with the customer', 62, 2.0, 46);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Launch', 6);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 1 of 2, session 1 of 2 (max 25)', 63, 1.0, 47);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 1 of 2, session 2 of 2 (max 25)', 63, 1.0, 48);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 2 of 2, session 1 of 2 (max 25)', 64, 1.0, 49);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop 2 of 2, session 2 of 2 (max 25)', 65, 1.0, 50);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop 1 of 2 (1 hr, max 25)', 65, 1.0, 51);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop 2 of 2 (1 hr, max 25)', 66, 1.0, 52);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify user training', 67, 4.0, 53);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 1 of 2 (1 hr, max 25)', 67, 1.0, 54);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 2 of 2 (1 hr, max 25)', 68, 1.0, 55);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Complete Project', 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Obtain project sign-off at go-live', 69, 1.75, 56);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Update the CRM', 69, 1.75, 57);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Introduce the Outreach account team', 70, 1.75, 58);
END $$;

-- ----------------------------------------------------------------------
-- Outreach Implementation — Amplify Pro (1-19 seats)

DO $$
DECLARE
  v_t text; v_s text; v_p text;
BEGIN
  DELETE FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation — Amplify Pro (1-19 seats)';
  v_t := gen_random_uuid()::text;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_t, 'Outreach Implementation — Amplify Pro (1-19 seats)', 'From the signed SOW: 58 hours over 8 weeks, up to 19 seats, 3 user groups, 1 Amplify use case. In scope: Engage, Meet, Deal, Forecast, Amplify.', now(), now());

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Kickoff', 0);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Prepare for kickoff', 1, 1.25, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Conduct project review with the Outreach / RevOptics salesperson', 1, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Schedule the kickoff', 1, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Confirm the platform capabilities in scope', 1, NULL, 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the kickoff', 2, 1.75, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Load success metrics into SFDC', 2, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Add contact roles into SFDC', 2, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Identify project, executive and technical sponsors', 2, NULL, 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Build and share the project plan', 3, 0.5, 8);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Weekly status report', 4, 1.25, 9);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Workflow Discovery & AI Design', 1);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Engage (3 user groups)', 5, 1.75, 10);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Meet', 6, 0.5, 11);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Deal', 7, 0.5, 12);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Forecast (current-state motions)', 9, 1.25, 13);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Advise on future-state forecasting workflows', 10, 0.5, 14);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm Amplify use case details and data requirements (1 use case)', 11, 1.25, 15);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Summarise workflows and share back', 12, 0.5, 16);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Content Strategy', 2);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content strategy call', 13, 1.25, 17);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content workshop', 15, 1.75, 18);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content settings call', 16, 0.5, 19);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Meet — content card configuration guidance', 17, 0.5, 20);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Deal — Action Plans introduction workshop', 18, 1.25, 21);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Deal — template library best practices', 20, 0.5, 22);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify — align the AI agent content framework', 21, 1.25, 23);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Data Workflow & System Configuration', 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin configuration', 22, 2.5, 24);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin testing', 24, 1.5, 25);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Governance configuration', 25, 1.5, 26);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Triggers and automation', 27, 0.75, 27);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'SSO and Branded URL setup', 28, 0.75, 28);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Data enrichment review — signals and personalization', 30, 0.75, 29);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Configure forecast views and metrics', 31, 2.25, 30);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Amplify Build', 4);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — prompt build out', 34, 8.0, 31);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 34, NULL, 32);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 34, NULL, 33);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — prompt testing', 37, 4.0, 34);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 37, NULL, 35);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — prompt launch', 40, 1.25, 36);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case — evaluation and feedback', 43, 2.75, 37);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Pre-Launch', 5);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the pre-launch checkpoint', 44, 0.75, 38);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Review content and user settings', 45, 1.5, 39);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Training consultation', 47, 1.5, 40);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Send user configuration and account set-up instructions', 48, 0.75, 41);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm the go-live checklist with the customer', 49, 0.75, 42);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Launch', 6);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop, session 1 of 2 (max 19)', 50, 1.0, 43);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop, session 2 of 2 (max 19)', 51, 1.0, 44);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop (1 hr, max 19)', 51, 1.0, 45);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify user training', 52, 1.5, 46);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 1 of 2 (1 hr, max 19)', 53, 1.0, 47);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 2 of 2 (1 hr, max 19)', 54, 1.0, 48);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Complete Project', 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Obtain project sign-off at go-live', 55, 0.75, 49);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Update the CRM', 55, 0.75, 50);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Introduce the Outreach account team', 56, 0.75, 51);
END $$;

-- ----------------------------------------------------------------------
-- Outreach Implementation — Amplify Pro (20-49 seats)

DO $$
DECLARE
  v_t text; v_s text; v_p text;
BEGIN
  DELETE FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation — Amplify Pro (20-49 seats)';
  v_t := gen_random_uuid()::text;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_t, 'Outreach Implementation — Amplify Pro (20-49 seats)', 'From the signed SOW: 110 hours over 10 weeks, up to 49 seats, 4 user groups, 2 Amplify use cases. In scope: Engage, Meet, Deal, Forecast, Amplify.', now(), now());

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Kickoff', 0);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Prepare for kickoff', 2, 2.25, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Conduct project review with the Outreach / RevOptics salesperson', 2, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Schedule the kickoff', 2, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Confirm the platform capabilities in scope', 2, NULL, 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the kickoff', 3, 3.5, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Load success metrics into SFDC', 3, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Add contact roles into SFDC', 3, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Identify project, executive and technical sponsors', 3, NULL, 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Build and share the project plan', 4, 1.25, 8);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Weekly status report', 6, 2.25, 9);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Workflow Discovery & AI Design', 1);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Engage (4 user groups)', 7, 3.5, 10);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Meet', 9, 1.25, 11);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Deal', 10, 1.25, 12);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Forecast (current-state motions)', 11, 2.25, 13);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Advise on future-state forecasting workflows', 12, 1.25, 14);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm Amplify use case details and data requirements (2 use cases)', 14, 2.25, 15);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Summarise workflows and share back', 15, 1.25, 16);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Content Strategy', 2);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content strategy call', 17, 2.5, 17);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content workshop', 18, 3.75, 18);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content settings call', 20, 1.25, 19);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Meet — content card configuration guidance', 22, 1.25, 20);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Deal — Action Plans introduction workshop', 24, 2.5, 21);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Deal — template library best practices', 25, 1.25, 22);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify — align the AI agent content framework', 27, 2.5, 23);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Data Workflow & System Configuration', 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin configuration', 29, 2.75, 24);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin testing', 30, 3.0, 25);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Governance configuration', 32, 3.0, 26);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Triggers and automation', 34, 1.5, 27);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'SSO and Branded URL setup', 36, 1.5, 28);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Data enrichment review — signals and personalization', 37, 1.5, 29);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Configure forecast views and metrics', 39, 4.25, 30);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Amplify Build', 4);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt build out', 41, 8.0, 31);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 41, NULL, 32);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 41, NULL, 33);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt testing', 43, 4.0, 34);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 43, NULL, 35);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt launch', 44, 1.25, 36);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — evaluation and feedback', 46, 2.75, 37);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt build out', 48, 8.0, 38);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 48, NULL, 39);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 48, NULL, 40);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt testing', 49, 4.0, 41);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 49, NULL, 42);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt launch', 51, 1.25, 43);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — evaluation and feedback', 53, 2.75, 44);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Pre-Launch', 5);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the pre-launch checkpoint', 55, 1.5, 45);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Review content and user settings', 57, 3.0, 46);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Training consultation', 58, 3.0, 47);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Send user configuration and account set-up instructions', 60, 1.5, 48);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm the go-live checklist with the customer', 62, 1.5, 49);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Launch', 6);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop, session 1 of 2 (max 19)', 63, 1.0, 50);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop, session 2 of 2 (max 19)', 64, 1.0, 51);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop (1 hr, max 19)', 65, 1.0, 52);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify user training', 66, 3.25, 53);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 1 of 2 (1 hr, max 19)', 67, 1.0, 54);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 2 of 2 (1 hr, max 19)', 68, 1.0, 55);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Complete Project', 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Obtain project sign-off at go-live', 69, 1.5, 56);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Update the CRM', 69, 1.5, 57);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Introduce the Outreach account team', 70, 1.5, 58);
END $$;

-- ----------------------------------------------------------------------
-- Outreach Implementation — Amplify Pro (50-99 seats)

DO $$
DECLARE
  v_t text; v_s text; v_p text;
BEGIN
  DELETE FROM onespace."ProjectTemplate" WHERE name = 'Outreach Implementation — Amplify Pro (50-99 seats)';
  v_t := gen_random_uuid()::text;
  INSERT INTO onespace."ProjectTemplate" (id,name,description,"createdAt","updatedAt")
  VALUES (v_t, 'Outreach Implementation — Amplify Pro (50-99 seats)', 'From the signed SOW: 177 hours over 12 weeks, up to 99 seats, 6 user groups, 2 Amplify use cases. In scope: Engage, Meet, Deal, Forecast, Amplify.', now(), now());

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Kickoff', 0);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Prepare for kickoff', 2, 3.75, 0);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Conduct project review with the Outreach / RevOptics salesperson', 2, NULL, 1);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Schedule the kickoff', 2, NULL, 2);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Confirm the platform capabilities in scope', 2, NULL, 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the kickoff', 4, 5.75, 4);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Load success metrics into SFDC', 4, NULL, 5);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Add contact roles into SFDC', 4, NULL, 6);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Identify project, executive and technical sponsors', 4, NULL, 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Build and share the project plan', 5, 2.0, 8);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Weekly status report', 7, 3.75, 9);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Workflow Discovery & AI Design', 1);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Engage (6 user groups)', 9, 5.75, 10);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Meet', 10, 2.0, 11);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Deal', 12, 2.0, 12);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Workflow interviews — Forecast (current-state motions)', 13, 3.75, 13);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Advise on future-state forecasting workflows', 15, 2.0, 14);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm Amplify use case details and data requirements (2 use cases)', 16, 3.75, 15);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Summarise workflows and share back', 18, 2.0, 16);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Content Strategy', 2);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content strategy call', 20, 4.0, 17);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content workshop', 22, 6.0, 18);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Content settings call', 24, 2.0, 19);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Meet — content card configuration guidance', 26, 2.0, 20);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Deal — Action Plans introduction workshop', 28, 4.0, 21);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Deal — template library best practices', 30, 2.0, 22);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify — align the AI agent content framework', 32, 4.0, 23);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Data Workflow & System Configuration', 3);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin configuration', 34, 5.75, 24);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'CRM plugin testing', 36, 4.75, 25);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Governance configuration', 38, 4.75, 26);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Triggers and automation', 41, 2.5, 27);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'SSO and Branded URL setup', 43, 2.5, 28);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Data enrichment review — signals and personalization', 45, 2.5, 29);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Configure forecast views and metrics', 47, 7.25, 30);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Amplify Build', 4);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt build out', 49, 13.0, 31);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 49, NULL, 32);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 49, NULL, 33);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt testing', 51, 6.5, 34);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 51, NULL, 35);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — prompt launch', 53, 2.25, 36);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 1 — evaluation and feedback', 55, 4.25, 37);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt build out', 58, 13.0, 38);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Draft the prompt', 58, NULL, 39);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Map the data the prompt needs', 58, NULL, 40);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt testing', 60, 6.5, 41);
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (gen_random_uuid()::text, v_t, v_s, v_p, 'Team to review output and mapping', 60, NULL, 42);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — prompt launch', 62, 2.25, 43);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Use case 2 — evaluation and feedback', 64, 4.25, 44);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Pre-Launch', 5);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Run the pre-launch checkpoint', 66, 2.5, 45);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Review content and user settings', 68, 5.0, 46);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Training consultation', 70, 5.0, 47);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Send user configuration and account set-up instructions', 72, 2.5, 48);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Confirm the go-live checklist with the customer', 74, 2.5, 49);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Launch', 6);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop, session 1 of 2 (max 19)', 75, 1.0, 50);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'End user training workshop, session 2 of 2 (max 19)', 76, 1.0, 51);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Manager workshop (1 hr, max 19)', 78, 1.0, 52);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Amplify user training', 79, 5.25, 53);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 1 of 2 (1 hr, max 19)', 80, 1.0, 54);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Office hours session 2 of 2 (1 hr, max 19)', 81, 1.0, 55);

  v_s := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateSection" (id,"templateId",name,"orderIndex")
  VALUES (v_s, v_t, 'Complete Project', 7);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Obtain project sign-off at go-live', 82, 2.25, 56);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Update the CRM', 83, 2.25, 57);
  v_p := gen_random_uuid()::text;
  INSERT INTO onespace."TemplateTask" (id,"templateId","sectionId","parentId",name,"offsetDays","estimatedHours","orderIndex")
  VALUES (v_p, v_t, v_s, NULL, 'Introduce the Outreach account team', 84, 2.25, 58);
END $$;

COMMIT;


-- ------------------------------------------------------------- confirm
select t.name,
       count(*) filter (where tt."parentId" is null) as steps,
       count(*) filter (where tt."parentId" is not null) as subtasks,
       sum(tt."estimatedHours") as hours,
       max(tt."offsetDays") as runs_days
from onespace."ProjectTemplate" t
  join onespace."TemplateTask" tt on tt."templateId" = t.id
where t.name like 'Outreach Implementation — Amplify%'
group by 1 order by 1;
