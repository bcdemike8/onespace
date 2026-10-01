-- The RocketLane weekly update, split by how often each field changes.
--
-- The template RevOptics has to file every Thursday carries nineteen fields;
-- a status update here carried two, a health and a note. Retyping the other
-- seventeen for every project every week is the thing that stops the updates
-- getting written at all.
--
-- The engagement facts go on the project, because they are true for months:
-- the use cases, the KPIs, which Amplify agents are in scope, who the
-- competitor is, when the evaluation runs. The narrative goes on the update,
-- because it is the week. `health` was already the RAG status and `note` is
-- Current Status, so neither is duplicated here.
--
-- Everything is nullable. A one-line "still on track" is a legitimate update,
-- and a form that demands seven boxes is a form nobody fills in.

ALTER TABLE "onespace"."Project"
  ADD COLUMN IF NOT EXISTS "useCases"            TEXT,
  ADD COLUMN IF NOT EXISTS "kpis"                TEXT,
  ADD COLUMN IF NOT EXISTS "isAmplify"           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "amplifyStatus"       TEXT,
  ADD COLUMN IF NOT EXISTS "amplifyProduct"      TEXT,
  ADD COLUMN IF NOT EXISTS "amplifyDataProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "amplifyCompetitor"   TEXT,
  ADD COLUMN IF NOT EXISTS "evaluationStartDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "evaluationDueDate"   TIMESTAMP(3);

ALTER TABLE "onespace"."StatusUpdate"
  ADD COLUMN IF NOT EXISTS "ragReasons"      TEXT,
  ADD COLUMN IF NOT EXISTS "painPoints"      TEXT,
  ADD COLUMN IF NOT EXISTS "risk"            TEXT,
  ADD COLUMN IF NOT EXISTS "nextSteps"       TEXT,
  ADD COLUMN IF NOT EXISTS "customerQuotes"  TEXT,
  ADD COLUMN IF NOT EXISTS "baselineMetrics" TEXT,
  ADD COLUMN IF NOT EXISTS "projectMetrics"  TEXT;

-- Projects already named for an Amplify SOW are Amplify engagements. Saves
-- ticking forty boxes by hand, and the flag is editable either way.
UPDATE "onespace"."Project"
   SET "isAmplify" = true
 WHERE "name" ILIKE '%amplify%';
