-- Who is an admin, and making yourself one.
-- =========================================
-- Several things in OneSpace are admin-only: People, Clients, Templates,
-- Import, "Sync everyone" and "Re-read transcripts". A member doesn't see a
-- greyed-out button - the button isn't on the page at all, which looks
-- exactly like a feature nobody built.
--
-- Run the whole file. It prints who is who, promotes one person, and prints
-- the result. Safe to run twice; the second time changes nothing.
--
-- Every table is written as onespace."User" rather than relying on the search
-- path, because the Supabase SQL editor doesn't carry a SET across statements
-- and you get: relation "User" does not exist.

-- 1. Who's who now.
select
  name,
  email,
  role,
  case when "isActive" then 'active' else 'switched off' end as status
from onespace."User"
order by role, name;

-- 2. Make yourself an admin.
--    Change the address if you sign in as somebody else.
update onespace."User"
set role = 'ADMIN'
where lower(email) = lower('brianna@revoptics.co')
  and role <> 'ADMIN';

-- 3. Did it take? If this comes back with no rows for your address, the
--    address in step 2 doesn't match the one stored - check the list from
--    step 1 for a different spelling.
select name, email, role
from onespace."User"
where role = 'ADMIN'
order by name;
