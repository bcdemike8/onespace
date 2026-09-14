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
| `onespace-client-domains.sql` | Maps clients to the email domains Google matching depends on. Section 2 reads your own unmatched meetings and tells you which domains are worth adding | Optional — the Clients page does the same thing one at a time |
| `onespace-domain-worksheet.sql` | Read-only. Prints every unmapped client and partner as fill-in-the-blank lines, ordered by how much work each represents | Run first |
| `onespace-partner-domains.sql` | Maps partners to their domains. A partner in a client meeting must not read as a second client | Optional — the Clients page does the same |
| `onespace-client-domains-filled.sql` | The 48 client domains Brianna supplied, ready to run. Previews every row, refuses anything whose client name doesn't match, and is safe to re-run | Ready |
| `onespace-cleanup.sql` | Moves Ricky Cookson's two projects to Brianna; merges "Factory Fix" into "FactoryFix, LLC" | |
| `onespace-billing-types.sql` | Marks the 18 projects that only ever logged non-billable time | |
| `onespace-subtasks.sql` | Reattaches 91 imported subtasks to their parents | |
| `onespace-close-stale-tasks-v2.sql` | Closes 299 tasks created or due more than 60 days ago | |
| `onespace-tag-import.sql` | Tags the first Everhour import so the importer's replace option can see it. **Run before re-uploading the dated export.** | |
| `onespace-close-old-tasks.sql` | Closes every open task that was due more than 7 days ago — the Asana backlog that makes "Today" on My work unreadable. Leaves recent, future and undated tasks alone. Backs up first; the undo is at the bottom of the file | Run |
| `onespace-health.sql` | Read-only. Twelve things that fail quietly — who can't sign in, billable hours stamped at zero, clients with no domains, calls with no write-up, projects over budget, near-duplicate clients. Nothing here throws an error in the app; it just makes something not work | Run first when something feels wrong |
| `onespace-status.sql` | Read-only. Prints which of the above have been run and which haven't. | |

## Running one

Supabase → the RevOptics project → **SQL Editor** → **New query**, paste the
whole file, **Run**. Read the preview it prints before letting it commit.

Every table is written out in full as `onespace."Thing"`. The editor doesn't
carry a `SET search_path` from one statement to the next, so a script that
sets it once at the top fails on the first table it reaches with
`relation "User" does not exist`.

`onespace-status.sql` is safe to run at any time and changes nothing.

## Order

Only one pair has a required order: `onespace-tag-import.sql` must run **before** the
dated Everhour export is re-uploaded, or the importer can't see the rows it
needs to replace and you end up with both copies.
