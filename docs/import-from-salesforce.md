# Importing the Salesforce export

Run this from your own machine. The page in the app does the same thing, but
sends a four-megabyte CSV through a single web request — two ways to fail
(the upload limit and the request timeout) and, when it does fail, the
useless sentence "an unexpected response was received from the server".

From a terminal the files never move, nothing times out, and a failure
prints what actually went wrong.

## Once, to set up

You need Node 20 or newer. Check:

    node --version

If that errors, install Node from nodejs.org first.

Then, somewhere you'll remember:

    git clone https://github.com/bcdemike8/onespace.git
    cd onespace
    npm install

Make a file called `.env` in that folder with one line — the same database
URL the app uses in Railway:

    DATABASE_URL="postgresql://…?schema=onespace"

Copy it from Railway → app service → Variables → `DATABASE_URL`. Keep the
quotes. The scripts read this file themselves, so nothing else is needed.

If you'd rather not keep it on disk, pass it for a single run instead:

    DATABASE_URL='postgresql://…' npm run crm:status

## Every time

Put the CSVs in a folder — anywhere, a folder on your Desktop is fine. Then:

    npm run import:sfdc -- ~/Desktop/sfdc-export

It runs every step in order and prints a report for each:

    ACCOUNTS  (Account.csv)
      1,037 rows · 1,037 created · 0 updated
      → Two accounts are called "Skaled" — imported the second as "Skaled (2)".

Filenames are matched loosely, so `Account.csv` and
`Account - Sheet1.csv` both work. A file that isn't there is skipped rather
than treated as an error, so you can import a subset.

## Checking what landed

    npm run crm:status

Counts what's in the database against what the export contains, and then how
many deals carry each of the fields that were added late — the owner, the
partner AE, the probability, the contact roles. A percentage well under the
export's own means that step needs running again. It reads totals and writes
nothing.

## Running less than all of it

One step on its own:

    npm run import:sfdc -- ~/Desktop/sfdc-export --only=deals

From one step onwards:

    npm run import:sfdc -- ~/Desktop/sfdc-export --from=contacts

The steps, in the order they have to run:

| Step | File |
|---|---|
| `people` | `User.csv` |
| `accounts` | `Account.csv` |
| `products` | `Product2.csv` |
| `contacts` | `Contact.csv` |
| `deals` | `Opportunity.csv` |
| `lines` | `OpportunityLineItem.csv` |
| `roles` | `OpportunityContactRole.csv` |

`RecordType.csv` is read automatically if it's in the folder, and used by
accounts and deals.

## People who have left

Salesforce users with no OneSpace account — colleagues who have moved on.
By default they are added as inactive people so their deals and contacts
keep the right owner; they have no usable password and never appear as
assignees.

    --people=create              keep them as inactive people (default)
    --people=none                leave their records unowned
    --people=<a OneSpace user id>  give their records to that person

## Running it again

Every step updates what's already there rather than duplicating it — each
record keeps its Salesforce id. So if a mapping turns out wrong, fix it and
run the same files again. There is nothing to clean up first, and no reason
to be careful about how many times you run it.

If a step fails, the ones after it don't run. Fix what it printed and run
again from there.
