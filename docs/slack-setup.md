# Connecting OneSpace to Slack

Twenty minutes, most of it in Slack's admin console. Nothing here is required —
without it OneSpace behaves exactly as it does today.

When it's done:

- **Monday morning** each person gets a DM listing what's overdue and what's due
  this week, plus any project they own that's at risk or off track.
- **Friday afternoon** each person gets a DM with the hours they logged that
  week, by project, and which weekdays are still empty.
- **`/onespace log 1.5 Acme kickoff`** logs time without leaving Slack.
- **Status updates** on a project post into that project's channel.

---

## 1. Create the Slack app

At <https://api.slack.com/apps> → **Create New App** → **From scratch**. Name it
`OneSpace`, pick the RevOptics workspace.

### Bot token scopes

**OAuth & Permissions** → *Scopes* → *Bot Token Scopes*. Add exactly these:

| Scope | Why |
|---|---|
| `chat:write` | Send the digests and status updates |
| `users:read` | List workspace members |
| `users:read.email` | Match people to OneSpace accounts by email |
| `channels:read` | List public channels for the project picker |
| `groups:read` | Same for private channels the bot is in |
| `commands` | The `/onespace` slash command |

Nothing here can read message history. The bot can post and can see who's in the
workspace; it cannot read what anyone says.

### Install it

**OAuth & Permissions** → **Install to Workspace**. Copy the **Bot User OAuth
Token** (`xoxb-…`).

### Signing secret

**Basic Information** → *App Credentials* → **Signing Secret** → Show, copy.

---

## 2. Add the variables in Railway

On the OneSpace service → **Variables**:

```
SLACK_BOT_TOKEN        xoxb-…            (from above)
SLACK_SIGNING_SECRET   …                 (from above)
CRON_SECRET            …                 (any long random string you invent)
APP_URL                https://…         (only if you're on a custom domain)
```

Railway redeploys. Once it's up, **People** in OneSpace shows a Slack panel with
your workspace name.

---

## 3. Match people to their Slack accounts

**People** → **Link Slack accounts**.

It matches on email, so someone's Slack profile has to use their `@revoptics.co`
address. Anyone it can't find is named in the result. Re-run it whenever you add
a person — nobody gets a digest until they're matched.

---

## 4. Turn on the slash command

Back in the Slack app → **Slash Commands** → **Create New Command**:

- Command: `/onespace`
- Request URL: `https://<your-onespace-url>/api/slack/command`
- Short description: `Log time and see what's on your plate`
- Usage hint: `log 1.5 Acme kickoff`

Slack will ask you to reinstall the app. Do that, and the token stays the same.

Test it with `/onespace help`.

---

## 5. Schedule the weekly digests

Railway runs a scheduled service to completion, so this is a second service in
the same project pointing at the same repo.

**New** → **GitHub Repo** → the OneSpace repo. Then on that service:

- **Settings → Deploy → Start Command**: `node scripts/slack-digest.mjs monday`
- **Settings → Cron Schedule**: `0 13 * * 1`
- **Variables**: `CRON_SECRET` (the same value) and `APP_URL` (your OneSpace URL)

Repeat for a second service with `node scripts/slack-digest.mjs friday` and
`0 20 * * 5`.

**Railway's cron is UTC.** The two above are 9am Monday and 4pm Friday US
Eastern while daylight saving is in effect; in winter they land an hour earlier,
so shift them to `0 14 * * 1` and `0 21 * * 5` in November if that bothers you.

You can trigger a run by hand at any time:

```bash
curl -X POST "https://<your-onespace-url>/api/cron/slack-digest?kind=monday" \
  -H "Authorization: Bearer $CRON_SECRET"
```

It replies with who it sent to, who was skipped, and who has no Slack account
yet.

---

## 6. Map projects to channels (optional)

Invite the bot to a channel — `/invite @OneSpace` — then open that project →
**Settings** → **Slack channel**. Status updates on the project now post there.

The bot only sees channels it's been invited to, so a channel missing from the
list means it hasn't been invited yet.

---

## What to expect in the first week

The Monday digest **stays quiet** for anyone with nothing overdue, nothing due
that week, and no project of theirs at risk. That's deliberate: a weekly "you
have 0 tasks" is how a useful nudge becomes something people mute.

The Friday digest **always sends**, including at zero, because an empty week is
exactly the one worth flagging before the month closes.

Time logged from Slack is a normal manual entry — it lands on today, respects
the project's billing type, and can't be written into a closed month.
