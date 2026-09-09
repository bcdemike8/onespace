# Connecting OneSpace to Slack

Twenty minutes, most of it in Slack's admin console. Nothing here is required —
without it OneSpace behaves exactly as it does today.

When it's done:

- **Every weekday at 5am CT** each person gets a DM with what's overdue, what's
  due today, any project they own that's at risk, and whether their time is up
  to date. On Mondays it widens to the week ahead.
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

## 5. Schedule the daily brief

Railway runs a scheduled service to completion, so this is a second service in
the same project pointing at the same repo.

**New** → **GitHub Repo** → the OneSpace repo. Then on that service:

- **Settings → Deploy → Start Command**: `node scripts/slack-digest.mjs`
- **Settings → Cron Schedule**: `0 10 * * 1-5`
- **Variables**: `CRON_SECRET` (the same value the app has) and `APP_URL`

**Railway's cron is UTC.** `0 10 * * 1-5` is 5am Central while daylight saving
is in effect. When it ends on 2 November 2026, change it to `0 11 * * 1-5` or
the brief arrives at 4am.

`1-5` is Monday to Friday. Use `0 10 * * *` if you want it at weekends too.

You can trigger a run by hand at any time:

```bash
curl -X POST "https://<your-onespace-url>/api/cron/slack-digest" \
  -H "Authorization: Bearer $CRON_SECRET"
```

It replies with who it sent to, who was skipped, and who has no Slack account
yet.

## 6. Map projects to channels (optional)

Invite the bot to a channel — `/invite @OneSpace` — then open that project →
**Settings** → **Slack channel**. Status updates on the project now post there.

The bot only sees channels it's been invited to, so a channel missing from the
list means it hasn't been invited yet.

---

## What to expect in the first week

The brief **stays quiet** for anyone who has nothing overdue, nothing due today,
no project of theirs at risk, *and* logged time on the last working day. All
four have to be true. That's deliberate: a 5am message saying "all clear" every
morning is muted within a week.

Which means an empty day still gets a message if the time isn't logged — that
half is the point, and it's what stops the month closing on a gap.

Time logged from Slack is a normal manual entry — it lands on today, respects
the project's billing type, and can't be written into a closed month.
