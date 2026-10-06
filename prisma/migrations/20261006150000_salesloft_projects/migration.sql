-- The three Salesloft projects from Asana: D2L, and Great Minds twice.
--
-- A migration rather than three passes through the Import screen, for the
-- same reason the Salesloft template is one: a step that needs somebody to
-- remember it is a step that doesn't happen. These landed in the Asana
-- export and belong in OneSpace; nobody should have to shepherd them in.
--
-- Everything is from the exports as given — sections, task names, estimates,
-- due dates and which tasks were already finished. All three go to Marcus,
-- who is the assignee on every assigned task in all three files.
--
-- Three things the exports decide, not this file:
--   * "Manager Check-In via Email (Christian)" has no assignee in Asana, so
--     it arrives unassigned on both implementations. 3 hours each.
--   * "System Access" is an Asana subtask of "Project Kickoff" and comes in
--     as one, under its parent's section — Asana doesn't section subtasks.
--   * The 6:45 logged against D2L's configuration hours is Asana time, not
--     an estimate. Hours are a separate import; it is not brought across
--     here, and the project reads 0 logged until it is.
--
-- Idempotent and non-destructive. Clients are matched by name before being
-- created, so an existing D2L or Great Minds is used rather than duplicated.
-- Each project is skipped entirely if one with that name already exists, so
-- running this after somebody has already imported a file changes nothing.

DO $$
DECLARE
  v_owner text; v_client text; v_p text;
  v_s0 text; v_s1 text; v_s2 text; v_s3 text; v_s4 text;
  v_t0 text; v_t1 text; v_t2 text; v_t3 text; v_t4 text; v_t5 text; v_t6 text; v_t7 text; v_t8 text; v_t9 text; v_t10 text; v_t11 text; v_t12 text; v_t13 text; v_t14 text;
BEGIN
  SELECT id INTO v_owner FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1;

  -- D2L "Do It For You" Salesloft Implementation
  SELECT id INTO v_client FROM onespace."Client" WHERE lower(name) = lower('D2L') LIMIT 1;
  IF v_client IS NULL THEN
    v_client := gen_random_uuid()::text;
    INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
    VALUES (v_client, 'D2L', now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'D2L "Do It For You" Salesloft Implementation') THEN
    v_p := gen_random_uuid()::text;
    INSERT INTO onespace."Project" (id,name,"clientId","ownerId","startDate","dueDate","budgetHours","billingType","status","createdAt","updatedAt")
    VALUES (v_p, 'D2L "Do It For You" Salesloft Implementation', v_client, v_owner, '2026-04-22'::timestamp, '2026-05-27'::timestamp, 26.25, 'HOURLY', 'ACTIVE', now(), now());

    v_s0 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Phase 1: Kickoff (Week 1 )', 0);
    v_s1 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Phase 2: Configuration (Weeks 2-3)', 1);
    v_s2 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Phase 3: User Training (Weeks 3-4)', 2);
    v_s3 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Phase 4: Graduation (Weeks 4-5)', 3);
    v_s4 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Communication', 4);
    v_t0 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t0, v_p, v_s0, NULL, 'Review Scope', NULL, 'TODO', v_owner, '2026-04-22'::timestamp, 0.25, 0, NULL, now(), now());
    v_t1 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t1, v_p, v_s0, NULL, 'Project Kickoff', NULL, 'DONE', v_owner, '2026-04-23'::timestamp, 1, 1, now(), now(), now());
    v_t2 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t2, v_p, v_s0, NULL, 'Workflow Interview', NULL, 'DONE', v_owner, '2026-04-24'::timestamp, 1, 2, now(), now(), now());
    v_t3 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t3, v_p, v_s0, NULL, 'Content Strategy', NULL, 'DONE', v_owner, '2026-04-27'::timestamp, 1, 3, now(), now(), now());
    v_t4 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t4, v_p, v_s1, NULL, 'DIFY Configuration Hours', NULL, 'DONE', v_owner, '2026-05-05'::timestamp, 12, 4, now(), now(), now());
    v_t5 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t5, v_p, v_s1, NULL, 'Configuration Checkpoint', NULL, 'DONE', v_owner, '2026-05-08'::timestamp, 1, 5, now(), now(), now());
    v_t6 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t6, v_p, v_s1, NULL, 'Manager Check-In via Email (Christian)', NULL, 'TODO', NULL, '2026-05-11'::timestamp, 3, 6, NULL, now(), now());
    v_t7 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t7, v_p, v_s2, NULL, 'Enablement Review Session', NULL, 'DONE', v_owner, '2026-05-12'::timestamp, 0.5, 7, now(), now(), now());
    v_t8 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t8, v_p, v_s2, NULL, '1 Manager Training', NULL, 'TODO', v_owner, '2026-05-14'::timestamp, 1, 8, NULL, now(), now());
    v_t9 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t9, v_p, v_s2, NULL, '2 User Fundamentals Trainings', NULL, 'TODO', v_owner, '2026-05-15'::timestamp, 2, 9, NULL, now(), now());
    v_t10 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t10, v_p, v_s2, NULL, 'Office Hours', 'Customer receives either two 30 minute or 1 hour dedicated Q&A sessions.', 'TODO', v_owner, '2026-05-18'::timestamp, 1, 10, NULL, now(), now());
    v_t11 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t11, v_p, v_s2, NULL, 'Salesloft Analytics Session', NULL, 'TODO', v_owner, '2026-05-25'::timestamp, 1, 11, NULL, now(), now());
    v_t12 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t12, v_p, v_s3, NULL, 'Graduation Prep', NULL, 'TODO', v_owner, '2026-05-26'::timestamp, 0.25, 12, NULL, now(), now());
    v_t13 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t13, v_p, v_s3, NULL, 'Graduation', NULL, 'TODO', v_owner, '2026-05-27'::timestamp, 0.25, 13, NULL, now(), now());
    v_t14 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t14, v_p, v_s4, NULL, 'All Email + Slack Communication', NULL, 'TODO', v_owner, '2026-05-27'::timestamp, 1, 14, NULL, now(), now());
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (gen_random_uuid()::text, v_p, v_s0, v_t1, 'System Access', 'Place the follow credentials: 
    Salelsoft Email/Login 
    Salesloft Password 

Provide username+password should the client give you access to any additional tools', 'TODO', NULL, NULL, NULL, 15, NULL, now(), now());
  END IF;

  -- Great Minds | "DIFY" Salesloft Implementation
  SELECT id INTO v_client FROM onespace."Client" WHERE lower(name) = lower('Great Minds') LIMIT 1;
  IF v_client IS NULL THEN
    v_client := gen_random_uuid()::text;
    INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
    VALUES (v_client, 'Great Minds', now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Great Minds | "DIFY" Salesloft Implementation') THEN
    v_p := gen_random_uuid()::text;
    INSERT INTO onespace."Project" (id,name,"clientId","ownerId","startDate","dueDate","budgetHours","billingType","status","createdAt","updatedAt")
    VALUES (v_p, 'Great Minds | "DIFY" Salesloft Implementation', v_client, v_owner, '2026-01-09'::timestamp, '2026-02-13'::timestamp, 26.25, 'HOURLY', 'ACTIVE', now(), now());

    v_s0 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Phase 1: Kickoff (Week 1 )', 0);
    v_s1 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s1, v_p, 'Phase 2: Configuration (Weeks 2-3)', 1);
    v_s2 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s2, v_p, 'Phase 3: User Training (Weeks 3-4)', 2);
    v_s3 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s3, v_p, 'Phase 4: Graduation (Weeks 4-5)', 3);
    v_s4 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s4, v_p, 'Communication', 4);
    v_t0 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t0, v_p, v_s0, NULL, 'Review Scope', NULL, 'TODO', v_owner, '2026-01-09'::timestamp, 0.25, 0, NULL, now(), now());
    v_t1 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t1, v_p, v_s0, NULL, 'Project Kickoff', NULL, 'DONE', v_owner, '2026-01-12'::timestamp, 1, 1, now(), now(), now());
    v_t2 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t2, v_p, v_s0, NULL, 'Workflow Interview', NULL, 'DONE', v_owner, '2026-01-13'::timestamp, 1, 2, now(), now(), now());
    v_t3 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t3, v_p, v_s0, NULL, 'Content Strategy', NULL, 'DONE', v_owner, '2026-01-14'::timestamp, 1, 3, now(), now(), now());
    v_t4 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t4, v_p, v_s1, NULL, 'DIFY Configuration Hours', NULL, 'DONE', v_owner, '2026-01-22'::timestamp, 12, 4, now(), now(), now());
    v_t5 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t5, v_p, v_s1, NULL, 'Configuration Checkpoint', NULL, 'DONE', v_owner, '2026-01-23'::timestamp, 1, 5, now(), now(), now());
    v_t6 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t6, v_p, v_s1, NULL, 'Manager Check-In via Email (Christian)', NULL, 'TODO', NULL, '2026-01-27'::timestamp, 3, 6, NULL, now(), now());
    v_t7 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t7, v_p, v_s2, NULL, 'Enablement Review Session', NULL, 'TODO', v_owner, '2026-01-29'::timestamp, 0.5, 7, NULL, now(), now());
    v_t8 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t8, v_p, v_s2, NULL, '1 Manager Training', NULL, 'TODO', v_owner, '2026-02-02'::timestamp, 1, 8, NULL, now(), now());
    v_t9 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t9, v_p, v_s2, NULL, '2 User Fundamentals Trainings', NULL, 'TODO', v_owner, '2026-02-03'::timestamp, 2, 9, NULL, now(), now());
    v_t10 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t10, v_p, v_s2, NULL, 'Office Hours', 'Customer receives either two 30 minute or 1 hour dedicated Q&A sessions.', 'TODO', v_owner, '2026-02-04'::timestamp, 1, 10, NULL, now(), now());
    v_t11 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t11, v_p, v_s2, NULL, 'Salesloft Analytics Session', NULL, 'DONE', v_owner, '2026-02-11'::timestamp, 1, 11, now(), now(), now());
    v_t12 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t12, v_p, v_s3, NULL, 'Graduation Prep', NULL, 'DONE', v_owner, '2026-02-12'::timestamp, 0.25, 12, now(), now(), now());
    v_t13 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t13, v_p, v_s3, NULL, 'Graduation', NULL, 'DONE', v_owner, '2026-02-13'::timestamp, 0.25, 13, now(), now(), now());
    v_t14 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t14, v_p, v_s4, NULL, 'All Email + Slack Communication', NULL, 'TODO', v_owner, '2026-02-13'::timestamp, 1, 14, NULL, now(), now());
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (gen_random_uuid()::text, v_p, v_s0, v_t1, 'System Access', 'Place the follow credentials: 
    Salelsoft Email/Login 
    Salesloft Password 

Provide username+password should the client give you access to any additional tools', 'DONE', NULL, NULL, NULL, 15, now(), now(), now());
  END IF;

  -- Great Minds Training Hours
  SELECT id INTO v_client FROM onespace."Client" WHERE lower(name) = lower('Great Minds') LIMIT 1;
  IF v_client IS NULL THEN
    v_client := gen_random_uuid()::text;
    INSERT INTO onespace."Client" (id,name,"createdAt","updatedAt")
    VALUES (v_client, 'Great Minds', now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM onespace."Project" WHERE name = 'Great Minds Training Hours') THEN
    v_p := gen_random_uuid()::text;
    INSERT INTO onespace."Project" (id,name,"clientId","ownerId","startDate","dueDate","budgetHours","billingType","status","createdAt","updatedAt")
    VALUES (v_p, 'Great Minds Training Hours', v_client, v_owner, '2026-02-27'::timestamp, '2026-02-27'::timestamp, 10, 'HOURLY', 'ACTIVE', now(), now());

    v_s0 := gen_random_uuid()::text;
    INSERT INTO onespace."Section" (id,"projectId",name,"orderIndex") VALUES (v_s0, v_p, 'Training Hours (10 Hours)', 0);
    v_t0 := gen_random_uuid()::text;
    INSERT INTO onespace."Task" (id,"projectId","sectionId","parentId",name,description,status,"assigneeId","dueDate","estimatedHours","orderIndex","completedAt","createdAt","updatedAt")
    VALUES (v_t0, v_p, v_s0, NULL, 'Extra Training', NULL, 'TODO', v_owner, '2026-02-27'::timestamp, 10, 0, NULL, now(), now());
  END IF;
END $$;
