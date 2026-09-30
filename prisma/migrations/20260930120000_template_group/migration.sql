-- An explicit heading for a template in the New project picker.
--
-- Until now the picker read families out of the names: "Amplify Core (1-19
-- seats)" became "1-19 seats" under an "Amplify Core" heading. That works
-- for the eight Outreach SOWs, which come in sibling sets, and not at all
-- for a platform with one SOW to its name - a lone template falls into
-- "Other templates", which is where the Salesloft onboarding would have
-- landed. A column says what the heading is instead of inferring it.

ALTER TABLE "onespace"."ProjectTemplate"
  ADD COLUMN IF NOT EXISTS "groupName" TEXT;
