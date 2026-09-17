-- A domain can be missing from the match for two different reasons: nobody
-- attached it to a client, or they did and that client is archived. They
-- need different fixes, so the panel has to be able to tell them apart.

ALTER TABLE "UnmappedDomain"
  ADD COLUMN "archivedClientId" TEXT,
  ADD COLUMN "archivedClientName" TEXT;
