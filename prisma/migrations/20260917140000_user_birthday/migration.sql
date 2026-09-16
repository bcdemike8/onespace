-- A birthday as a day and a month. No year: nobody asked for one, and a date
-- column would force us to invent one and then remember to ignore it.

ALTER TABLE "User"
  ADD COLUMN "birthdayMonth" INTEGER,
  ADD COLUMN "birthdayDay" INTEGER;
