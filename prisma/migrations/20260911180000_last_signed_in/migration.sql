-- When each person last actually got in.
--
-- Diagnostic, not a feature: it separates "their password is wrong" from
-- "they have never tried", which is the first thing worth knowing when
-- somebody reports that login doesn't work.

ALTER TABLE "onespace"."User"
  ADD COLUMN IF NOT EXISTS "lastSignedInAt" TIMESTAMP(3);
