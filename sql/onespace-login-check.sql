-- Why can't they sign in?
-- =======================
-- "That email and password don't match" is deliberately vague on the login
-- page - it must not tell a stranger which addresses exist here. That makes
-- it useless for you, because it covers three completely different problems
-- with three different fixes.
--
-- This tells them apart. Read-only.
--
-- Put the address they are TYPING in the line below, exactly as they type it.

with attempt(typed) as (values
  ('someone@revoptics.co')        -- <- change this
)

select
  a.typed,
  u.email                             as stored_email,
  case
    when u.id is null then
      'NO ACCOUNT with that address. Check the spelling on the People page - '
      || 'login matches the whole address exactly.'
    when u."isActive" = false then
      'DEACTIVATED. They exist, but deactivated accounts are refused with the '
      || 'same message as a wrong password. Restore them on the People page.'
    when u."passwordHash" !~ '^scrypt\$[0-9a-f]+\$[0-9a-f]+$' then
      'PASSWORD NEVER SET PROPERLY - the stored hash is not in the expected '
      || 'shape. Use Reset password on the People page.'
    else
      'ACCOUNT IS FINE. Active, with a valid password hash - so the password '
      || 'being typed is wrong. Reset it and watch them type the new one.'
  end                                 as verdict,
  u."isActive",
  u."lastSignedInAt",
  -- Invisible differences that look identical on screen.
  length(u.email)                     as stored_length,
  length(a.typed)                     as typed_length,
  u.email <> lower(btrim(u.email))    as stored_has_case_or_space
from attempt a
  left join onespace."User" u
    on lower(btrim(u.email)) = lower(btrim(a.typed));


-- ----------------------------------------------------------------- everyone
-- The same check across the whole team, which is usually quicker than
-- guessing who to look at.

select
  name,
  email,
  case
    when "isActive" = false then 'deactivated - cannot sign in'
    when "passwordHash" !~ '^scrypt\$[0-9a-f]+\$[0-9a-f]+$' then 'no usable password'
    when "lastSignedInAt" is null then 'never signed in'
    else 'signed in ' || to_char("lastSignedInAt", 'DD Mon YYYY')
  end as state,
  email <> lower(btrim(email)) as email_needs_tidying
from onespace."User"
order by "isActive", name;


-- --------------------------------------------------------------- the tidy-up
-- Only if the column above says true for someone. An address stored with a
-- capital or a stray space can never be matched, because login lowercases
-- and trims what is typed before looking it up.
--
--   update onespace."User" set email = lower(btrim(email))
--    where email <> lower(btrim(email));
