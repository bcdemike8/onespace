-- The hours a deal's statement of work allows for.
--
-- The Salesforce export carried the money and never the hours, so a
-- consultant opening a closed-won deal could see $7,000 and had no way to
-- know whether that bought 20 hours or 60. It lives on the deal rather than
-- only on the project because it is a property of what was sold: it is true
-- the day the deal closes, and the project it becomes may not exist yet.

ALTER TABLE "onespace"."Deal"
  ADD COLUMN IF NOT EXISTS "hoursSold" DOUBLE PRECISION;
