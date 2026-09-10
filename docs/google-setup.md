# Connecting OneSpace to Google

Thirty minutes, all of it in two Google consoles. You need to be a Google
Workspace **super admin** for step 3 — nobody else can grant this.

When it's done:

- **Meetings** — everyone's calendar is read overnight. Client meetings appear
  under **Meetings** with a project already suggested and the reason for it.
  The person whose calendar it came from confirms, or points it somewhere else.
  Nothing reaches a timesheet without that.
- **Inbox** — client email appears as work to do. Threads where the client
  spoke last are flagged as waiting on a reply. You read, reply and send from
  OneSpace, mark the thread done, and book the time it took.

---

## What OneSpace is allowed to read

Three scopes, granted once for the whole domain:

| Scope | What it allows |
|---|---|
| `calendar.readonly` | Read calendars. It cannot create, move or cancel anything. |
| `gmail.readonly` | Read mail. |
| `gmail.send` | Send a reply. It cannot delete, archive or label. |

**Be clear-eyed about the Gmail one.** Google has no permission meaning "only
mail from these senders" — the grant covers the whole mailbox. OneSpace narrows
it in code instead: every Gmail search it runs is built from the domains you've
mapped to a client, so anything else is never requested, never parsed and never
stored. That's a promise the app keeps, not one Google enforces. If you'd rather
not grant it, do steps 1–5 and skip the Gmail scopes; the calendar half works on
its own.

---

## 1. Make a Google Cloud project and a service account

At <https://console.cloud.google.com/projectcreate> — name it `OneSpace`, create.

Then, in that project:

1. **Enable the two APIs.** <https://console.cloud.google.com/apis/library> →
   search **Google Calendar API** → Enable. Then **Gmail API** → Enable.
2. **Create the service account.**
   <https://console.cloud.google.com/iam-admin/serviceaccounts> →
   **Create service account**. Name it `onespace`. Skip the optional
   permissions and access steps — it needs no project roles at all.
3. **Make a key.** Click the account → **Keys** → **Add key** → **Create new
   key** → **JSON** → Create. A `.json` file downloads. It is the only copy;
   Google will not show it again.

#### If Google refuses to make the key

**"Service account key creation is disabled"** — an org policy,
`iam.disableServiceAccountKeyCreation`, which Google enables automatically for
organisations created recently. Nothing is misconfigured; it needs one narrow
exception.

The policy blocks *creating* keys, not using them, so the exception can be
temporary:

1. Switch the console's resource picker from the project to your
   **organization**.
2. **IAM & Admin → IAM** → grant yourself **Organization Policy Administrator**.
   A Workspace super admin can; without it the next screen is read-only.
3. **IAM & Admin → Organization policies** → *Disable service account key
   creation*.
4. Switch the picker back to the **OneSpace project**, then **Manage policy** →
   *Override parent's policy* → a rule with enforcement **Off** → **Set
   policy**. Scoped to the project, so the rest of the org stays protected.
5. **There are two of them.** That search returns both
   `iam.disableServiceAccountKeyCreation` (legacy, and the one the error
   names) and `iam-managed.disableServiceAccountKeyCreation` (its
   replacement), under near-identical titles. Google evaluates both
   concurrently, so turning off one leaves the other blocking. Apply the same
   project-scoped override to each.
6. Wait a minute and create the key.
7. Set both project policies back to **Inherit**. The key keeps working.

The alternative is per-person OAuth instead of delegation: no policy change, but
seven consent screens, a stored refresh token each, and a silent stop whenever
someone revokes access.

Open that file. You need two values out of it: `client_email` and
`private_key`.

You also need the account's **Client ID** — a long number, shown on the service
account's **Details** tab (also `client_id` in the JSON). Step 3 asks for it.

---

## 2. Add the credentials in Railway

On the **OneSpace app service** → **Variables**:

```
GOOGLE_CLIENT_EMAIL    onespace@onespace-xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY     -----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n
```

**Take the value from `private_key`, not `private_key_id`.** They sit on
adjacent lines in the JSON and the names differ by three characters. The one
you want is about 1,700 characters and starts `-----BEGIN PRIVATE KEY-----`;
`private_key_id` is 40 characters of hex. OneSpace names this specific mix-up
if you make it.

Copy the whole value including the BEGIN and END lines. The `\n` sequences can
stay as they are — OneSpace accepts the key in any shape it arrives in:
literal `\n`, real newlines, quotes, or line breaks lost altogether. The one
thing it can't recover is a value cut short, which happens if you paste into
Railway's raw `.env` editor with real line breaks in it — use the single
variable field instead.

Add the same two variables to the **cron service** as well, so the overnight
sync can authenticate.

---

## 3. Grant domain-wide delegation

This is the step only a super admin can do, and the one that fails silently if
a single character is wrong.

At <https://admin.google.com/ac/owl/domainwidedelegation> → **Add new**:

- **Client ID**: the long number from step 1.
- **OAuth scopes**: paste all three, comma-separated, no spaces:

```
https://www.googleapis.com/auth/calendar.readonly,https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send
```

**Authorise.**

The scopes must match what OneSpace asks for character for character. A scope
that's missing, misspelled, or has a stray space produces the same error as
having no delegation at all — OneSpace will tell you which, in words, rather
than failing blankly.

Changes here take a few minutes to reach Google's servers. If the first sync
fails, wait five minutes and try again before changing anything.

---

## 4. Map your clients to their email domains

**Clients** → each client now has an **Email domains** row. Add the domains
their people email from — `honeycomb.io`, `accessoneinc.com`. Several are fine
for one client; paste them comma-separated.

Paste whatever you have and it'll be tidied up: `@acme.com`, `www.acme.com`,
`someone@acme.com` all become `acme.com`.

**This is the setup everything else rests on**, and it is not optional. A
meeting or an email only comes into OneSpace at all if someone in it is on a
domain mapped to a client. A client with no domain gets nothing: no meetings,
no mail, and no warning beyond the sync saying it saw their domain and didn't
recognise it.

That strictness is the point. Most calendars carry far more internal,
prospect and networking meetings than client ones, and a suggestion list where
most rows are noise is a list nobody reads. Nothing is lost by it — map a
domain later, re-sync, and its meetings arrive as if they had been there all
along. Anything already logged is never touched.

**New projects ask for it.** Creating a project for a client with no domain
yet shows a field for it right there, because that is the one moment when
whoever is typing definitely knows the answer.

After each sync OneSpace names the unmapped domains it saw, most frequent
first — that is how a new client gets noticed. Domains you have already
decided against go in **Ignored domains**, which keeps them out of that list
without affecting anything else.

A domain can only belong to one client. If you try to add one that's taken,
OneSpace names the client that already has it.

### Partners get domains too, and it matters

Partners have their own **Email domains** row in the list below the clients.
Put `outreach.io` and `salesloft.com` there, not against a client.

This is not tidiness. A partner sits in on client calls constantly, so if
Outreach is registered as a client then every joint implementation call has two
customers in the room and matches neither. Listed as a partner, they're set
aside whenever a real customer is present, and the meeting lands where it
should.

A domain can be on both — Skaled is the partner work comes through *and* a
customer in its own right. When Skaled and a customer are both in the room, the
customer wins; when Skaled is the only outside party, it's Skaled's meeting.

---

## 5. Pull the first sync

**Meetings** → **Sync my calendar**. It reads from 1 August, so August and
September arrive at once.

Each meeting shows what OneSpace worked out and why — *"honeycomb.io in the
invite, and Honeycomb has one open project"*. Change the project or task if
it's wrong, adjust the time, and log it. **Not billable work** dismisses it for
good; the sync won't offer it again.

Then **Inbox** → **Sync my mail**. Slower, because it reads a thread at a time.

**Sync everyone** does the whole team, and is admin-only.

### What never becomes a suggestion

Declined invites, all-day entries, cancelled meetings, out-of-office and
working-location blocks, anything over twelve hours, and meeting rooms counted
as guests. A meeting that hasn't happened yet is synced but not offered — you
can't have spent time on this afternoon's call.

---

## 6. The overnight run

Nothing to do — the existing cron service picks this up. It now runs three jobs
in order: calendar, mail, then the Slack brief, so the 5am message reflects what
the syncs just found. The brief gains a line when meetings are waiting to be
logged.

If you'd rather the syncs ran during the day too, add a second Railway cron
service pointed at the same repo with:

- **Cron Schedule**: `0 */2 * * *` (every two hours)
- **Variables**: `ONESPACE_ROLE=cron`, `ONESPACE_JOB=calendar` (or `mail`),
  plus `APP_URL` and `CRON_SECRET`

`ONESPACE_JOB` unset means all three, which is what the existing service does.

---

## When something doesn't work

OneSpace translates Google's errors rather than passing them through, so the
message on screen usually names the fix. The three you're most likely to see:

**"Google won't let the app act as *someone*"** — delegation isn't granted, or
the scopes don't match. Back to step 3. Check for a trailing space.

**"Either that mailbox doesn't exist, or domain-wide delegation hasn't been
granted"** — usually a person in OneSpace whose email isn't a real Workspace
account. Check their address on the People page.

**"GOOGLE_PRIVATE_KEY isn't a readable key"** — the key got mangled on the way
into Railway. Re-copy it from the JSON, including BEGIN and END.

**"Service account key creation is disabled"** — an org policy. See step 1.

**No client mail found** — almost always no domains mapped yet. Step 4.
