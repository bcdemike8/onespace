-- Who is an admin, and making yourself one.
--
-- Several things in OneSpace are admin-only: People, Clients, Templates,
-- Import, "Sync everyone", and "Re-read transcripts". A member sees none of
-- them - the buttons simply aren't on the page, which looks the same as a
-- feature that hasn't been built.
--
-- Run the SELECT first. If your own row says MEMBER, that's why.

SET search_path TO onespace;

-- 1. Who's who.
SELECT
  name,
  email,
  role,
  CASE WHEN "isActive" THEN 'active' ELSE 'switched off' END AS status
FROM "User"
ORDER BY role, name;

-- 2. Make yourself an admin.
--
-- Change the address if you sign in as someone else. It only affects the
-- one row, and running it twice does nothing the second time.
UPDATE "User"
SET role = 'ADMIN'
WHERE lower(email) = lower('bri@revoptics.co')
  AND role <> 'ADMIN';

-- 3. Check it took.
SELECT name, email, role FROM "User" WHERE role = 'ADMIN' ORDER BY name;
