# One-off SQL

Data migration and clean-up scripts, run by hand in the Supabase SQL Editor.
These are **not** Prisma migrations — `prisma/migrations/` owns the schema and
runs automatically on deploy. These move *data*, and each one was written for a
specific moment in the move off Asana and Everhour.

Kept in the repo because they're the record of how the data got into the shape
it's in, and because a script that touched production is worth being able to
read back later.

Every file follows the same shape: preview what it will change, back it up to a
table, change it, print a confirmation, and carry the undo in a comment at the
bottom.

| File | What it does | Status |
|---|---|---|
| `onespace-setup.sql` | The original import: 54 Asana projects, their sections, tasks and estimates, plus clients, partners and people | Run |
| `onespace-owners.sql` | Sets the owner on 125 projects — 59 from Everhour's Leads column, 66 inferred from who logged the most hours | Run |
| `onespace-sow-templates.sql` | The eight Amplify implementation templates built from the signed SOWs | Run |
| `onespace-cleanup.sql` | Moves Ricky Cookson's two projects to Brianna; merges "Factory Fix" into "FactoryFix, LLC" | |
| `onespace-billing-types.sql` | Marks the 18 projects that only ever logged non-billable time | |
| `onespace-subtasks.sql` | Reattaches 91 imported subtasks to their parents | |
| `onespace-close-stale-tasks-v2.sql` | Closes 299 tasks created or due more than 60 days ago | |
| `onespace-tag-import.sql` | Tags the first Everhour import so the importer's replace option can see it. **Run before re-uploading the dated export.** | |
| `onespace-status.sql` | Read-only. Prints which of the above have been run and which haven't. | |

## Running one

Supabase → the RevOptics project → **SQL Editor** → **New query**, paste the
whole file, **Run**. Read the preview it prints before letting it commit.

`onespace-status.sql` is safe to run at any time and changes nothing.

## Order

Only one pair has a required order: `onespace-tag-import.sql` must run **before** the
dated Everhour export is re-uploaded, or the importer can't see the rows it
needs to replace and you end up with both copies.
