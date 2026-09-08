# RevOptics OneSpace

Templated projects, task tracking and billable time — the slice of Asana +
Everhour that actually gets used, in one app you own.

- **Templates** — build a playbook once (steps, owners, estimates, due-date
  offsets from kickoff), then stamp out a project from it in a few clicks.
- **Tasks** — sections, assignees, due dates, statuses. People see exactly
  what's theirs and what's overdue.
- **Time** — a weekly timesheet grid, a one-click stopwatch, or manual entry.
  Every hour lands on a task, and therefore on a project and a client.
- **Reports** — hours and money by project, client, person, task or date, for
  any range, at day/week/month resolution, with CSV export.
- **Budget vs actual** — hours burn and, crucially, cost burn priced at each
  person's real hourly cost, so you can see which work is actually profitable.

Stack: Next.js 15 (App Router, server actions) · Prisma · Postgres · Tailwind 4.
Runs on Railway against a Supabase database.

---

## 1. Create the database (Supabase)

1. Create a Supabase project. Pick a region near where Railway will run, and
   save the database password it makes you set — it's part of both URLs below
   and Supabase won't show it again.
2. Hit **Connect** at the top of the project dashboard. Copy two strings:
   - **Transaction pooler**, port `6543` → `DATABASE_URL`
   - **Session pooler**, port `5432` → `DIRECT_URL`
3. Add `?pgbouncer=true&connection_limit=5` to the end of the transaction one.

```
DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5"
DIRECT_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Why two: the app runs its normal queries through the transaction pooler, which
is the efficient one but hands out a different connection per statement.
`prisma migrate` needs a single connection it keeps for the whole migration —
it takes an advisory lock so two deploys can't migrate at once — so it gets the
session pooler instead.

Supabase also offers a **Direct connection** (`db.<ref>.supabase.co`). It works
for `DIRECT_URL` too, but it's IPv6-only without a paid add-on, so the session
pooler is the safer default.

Two things that reliably go wrong:

- **Special characters in the password.** They must be percent-encoded in the
  URL — `@` becomes `%40`, `#` becomes `%23`, and so on. Easiest to avoid by
  letting Supabase generate the password.
- **`connection_limit`.** `1` is the right answer for serverless, and it's what
  most Supabase snippets show — but it's wrong here. This app runs as one
  always-on container, and a limit of 1 makes every request queue behind the
  last one. Use `5`.

## 2. Deploy (Railway)

1. New project → **Deploy from GitHub repo** → pick this repo.
2. Add `DATABASE_URL` and `DIRECT_URL` as service variables.
3. Deploy. `railway.json` already tells Railway to run
   `prisma migrate deploy` before starting, so the schema is created and kept
   up to date on every release.
4. Open the generated URL. The first visit shows a **one-time setup form** —
   the account you create there becomes the administrator. Once it exists,
   that form is replaced by the normal sign-in screen.

Railway sets `PORT` itself; the start script reads it.

## 3. Add your people

**People** (admin only) is where you add everyone and set two rates:

| Rate | What it means | What it drives |
| --- | --- | --- |
| **Cost / hour** | What this person actually costs you | Cost and margin columns; budget-vs-actual burn |
| **Bill / hour** | What you charge a client for their time | Billable value; the number you invoice from |

Rates are **snapshotted onto each time entry when it's logged**. Giving someone
a raise changes future entries only — last quarter's reports and anything
you've already invoiced stay exactly as they were.

A project can override the bill rate for everyone working on it.

## 4. Build a template, then run projects from it

**Templates → New template**, then add steps. Each step carries:

- an owner (who normally does it),
- an estimate in hours,
- a **due day** — an offset counted forward from the project's start date.
  Day `0` is kickoff, day `5` is five days later, a negative number is before
  kickoff, blank means no deadline.

Then **Projects → New project**, pick the template, name it, set the start
date. Every section, task, owner and estimate comes across, and each due date
is resolved against that start date. The hours budget defaults to the sum of
the template's estimates.

Already running a project that looks right? Open it and hit **Save as
template** — its tasks become a playbook, with due dates converted back into
day offsets.

## 5. Logging time

Three ways, all landing in the same place:

- **Timesheet** — a Mon–Sun grid, one row per task. Type `1.5`, `1:30` or
  `90m`; cells save when you tab away. Open tasks assigned to you are
  pre-listed as rows.
- **Stopwatch** — hit ▶ on any task. A bar pins to the top of every page;
  *Stop & log* banks it as an entry. Starting a second timer banks the first
  rather than losing it.
- **Manual** — the *Log time* box on the dashboard and on each project.

Mistyped an entry? Hover it in a project's time log and hit ✎. Members can
correct their own time; admins can correct anyone's.

## 6. Bringing Asana and Everhour across

**Import** (admin only) reads the CSV exports from both tools. Every import
shows you exactly what it will do before writing anything.

**Asana — one file per project.** In Asana: open the project → the ▾ beside its
name → Export / Print → CSV. The importer reads Name, Section/Column,
Assignee, Assignee Email, Due Date, Notes, Completed At and Estimated time
(Asana writes that as `H:MM`), locating each by name so it survives Asana
changing its export format. You choose the client, the kickoff date, whether
to include subtasks and completed tasks, and whether to also save the
structure as a reusable template — which converts each due date into an
offset from kickoff.

**Everhour — one file for the whole date range.** Two shapes are supported and
detected automatically:

- A **detailed report** with one row per entry (Date, Member, Project, Task,
  Time). Day-level accuracy.
- A **saved "Historical Report"**, which groups rows under month headings
  rather than dating each one. Everything in it is filed on the first of its
  month, so month, quarter and year reports are exact but weekly ones are not.
  Subtotal and Total rows are recognised and skipped rather than double-counted.

The Historical Report also carries two things nothing else does, and both are
used: its **Client column is the partner** the work came through (the end
customer is parsed out of the project name instead), and its **Leads column
names the project lead**, which becomes the project owner on anything the
import creates.

Import your Asana projects first so the hours have somewhere to land; entries
are matched to projects and tasks by name, and to people by email then name —
including a longer form of the same name, since that report has no email
column.

Two things worth knowing:

- **Include the Billable amount and Cost columns** if your report offers them.
  The importer divides them by the hours to recover the rate that was actually
  in force, so historical money stays true instead of being restated at
  today's rates.
- **Imports are safe to re-run.** Re-running compares *counts* per identical
  row rather than mere existence, so four one-hour kickoff calls in the same
  month import as four hours the first time and add nothing the second. If
  some people were missing accounts on the first pass, add them under People
  and run the same file again; only the newly-matchable rows land.
- **A task name with no matching task is kept in the entry's note** rather than
  dropped. For projects that came from Everhour rather than Asana, that note is
  often the only record of what the time was spent on.

Anyone in the file without a OneSpace account is listed in the preview. Their
tasks come in unassigned and their hours are skipped, so add them first if you
want the work attributed.

## 6. Reports

Everything is a URL, so any report you run regularly is just a bookmark.

- **Rows are** — project, client, person, task or date
- **Broken down by** — an optional second level nested inside each row
- **Columns by** — day, week or month buckets across the range
- **Date range** — presets from Today to This year, or a custom from/to
- Filter by any combination of clients, projects and people, and by billability

Three exports:

| Button | What you get |
| --- | --- |
| **Export CSV** | The grouped table exactly as shown, one column per date bucket |
| **Export entries** | One row per time entry — the backup you attach to an invoice |
| **Budget vs actual → Export CSV** | Per-project hours and cost against budget |

Members only ever see their own time, and never see cost or margin.

---

## Clients and partners

A **client** is who the work is for; a **partner** is who it came through
(Outreach, Salesloft). Both live on a project, and reports group by either —
so you can read delivery by customer and channel performance by partner from
the same data. Manage both on the Clients page.

## Branding

`src/lib/brand.ts` holds the name and logo mark. The colour palette lives in
`src/app/globals.css` under `@theme` — change the `--color-brand-*` ramp there
and it flows through every button, link and highlight in the app.

## Running it locally

```bash
npm install
cp .env.example .env          # point it at any Postgres
npx prisma migrate dev        # create the schema
npm run seed -- --demo        # optional: an example client + template
npm run dev
```

`npm run seed` reads `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` /
`SEED_ADMIN_NAME`. You can skip it entirely — the first visit to `/login`
offers the setup form instead.

Useful scripts:

| Command | Does |
| --- | --- |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create + apply a migration in development |
| `npm run db:deploy` | Apply pending migrations (what Railway runs) |
| `npm run db:studio` | Prisma Studio, for poking at the data directly |

## How things are put together

```
prisma/schema.prisma      the data model, commented
src/lib/reporting.ts      every metric — hours, cost, billable, margin, budgets
src/lib/dates.ts          calendar-day handling, range presets, bucketing
src/lib/rates.ts          which rates get stamped onto a time entry
src/app/actions/          every mutation, as server actions
src/lib/csv.ts            RFC 4180 reader (quoted commas, embedded newlines)
src/lib/import/           Asana and Everhour CSV readers
src/app/(app)/            the signed-in app
```

A few decisions worth knowing about:

- **Money is integer cents, time is integer minutes.** Decimals only appear at
  the point of display, so rounding never accumulates.
- **Dates are calendar days, stored at UTC midnight.** An entry logged on the
  3rd stays on the 3rd regardless of where the server or the browser is.
- **Rates are snapshotted per entry** rather than looked up at report time.
- **Report aggregation happens in TypeScript, not SQL.** At this team size a
  report reads a few thousand rows at most, and it keeps every metric defined
  in exactly one place.
- **Deleting is avoided where it would destroy billing history.** A project
  with logged time archives instead of deleting; deactivating a person keeps
  every hour they ever logged.
