-- Acting as somebody else.
--
-- An admin needs to see OneSpace the way a colleague sees it — to run the
-- calendar sync somebody hasn't run, or to find out why a screen looks wrong
-- for them and right for everybody else. Describing a screen over Slack is a
-- poor substitute for standing in it.
--
-- It hangs off the session rather than off a cookie, so it cannot be forged
-- and it ends when the session does. `userId` keeps pointing at the real
-- admin throughout: that is what makes stopping always possible, and what
-- lets the banner say who is actually here.

ALTER TABLE "onespace"."Session"
  ADD COLUMN IF NOT EXISTS "actingAsUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "actingSince"    TIMESTAMP(3);

DO $$
BEGIN
  ALTER TABLE "onespace"."Session"
    ADD CONSTRAINT "Session_actingAsUserId_fkey"
    FOREIGN KEY ("actingAsUserId") REFERENCES "onespace"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Session_actingAsUserId_idx"
  ON "onespace"."Session"("actingAsUserId");
