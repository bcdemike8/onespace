-- The call write-up, with its structure kept.
--
-- summary stays as the rendered text - that is what gets pasted into a
-- recap email. summaryJson holds the same thing as overview, headed
-- sections, action items and outline, so the page can lay it out.

ALTER TABLE "onespace"."Meeting"
  ADD COLUMN IF NOT EXISTS "summaryJson" JSONB;
