# Connecting OneSpace to Zoom

Fifteen minutes, all in the Zoom App Marketplace. One credential for the whole
account, like the Google connection — nobody clicks a consent screen.

When it's done:

- **Meetings show what actually happened.** A 60-minute booking that ran 43
  minutes is 43 minutes. The calendar cannot know this, and has been wrong
  about every short call since the day it was switched on.
- **Calls that were never on a calendar come in.** Instant meetings and dials
  into a personal room are invisible to the calendar sync. They're real time.
- **What you said you'd do becomes tasks.** The transcript is read once, the
  promises RevOptics people made are lifted out of it, and each one is offered
  as a task assigned to whoever made it.

---

## What is and isn't stored

**The transcript is not kept.** It's read once and discarded. What survives is
a short summary of the call and the action items that came out of it, each
with the sentence it came from. The recording stays in Zoom behind a link, so
your retention and access rules there still apply.

**Where it's read.** With `ANTHROPIC_API_KEY` set, the transcript is sent to
Anthropic's API for the length of one request and is not retained there under
the API's default terms. Without that key, OneSpace falls back to pattern
rules that never leave the server and are markedly worse.

Client calls contain things that have no business sitting in a project
database, so the line matters — but it has moved, and honestly. The first
version of this said the transcript never left the server and that nothing
but single sentences was stored. Now a summary is stored, and the transcript
briefly leaves. Anyone told the old version should be told this one.

---

## 1. Create the app

At <https://marketplace.zoom.us/develop/create> → **Server-to-Server OAuth** →
name it `OneSpace`.

The **App Credentials** page gives you three values. All three go in Railway:

```
ZOOM_ACCOUNT_ID     …
ZOOM_CLIENT_ID      …
ZOOM_CLIENT_SECRET  …
```

The Account ID is the account's, not your user id. All three come from this
same app — mixing a client id from one app with a secret from another produces
a 401 that looks like a typo.

## 2. Add the scopes

**Scopes** → add:

| Scope | Why |
|---|---|
| `user:read:admin` | Find each person's Zoom account by email |
| `report:read:admin` | What a meeting actually did, and who was on it |
| `cloud_recording:read:list_recording_files:admin` | The recording, its transcript and its captions |
| `meeting_summary:read:admin` | AI Companion's summary, if your plan has it |

On newer apps these appear as granular scopes with longer names; search for
`report`, `recording` and `summary` and take the admin-level read ones.

`meeting_summary` is optional, and with Claude connected it does very little:
the transcript is the better source and is read first. It only matters for
calls that have no transcript at all.

`cloud_recording` is not optional. Without it every call reports that it has
no transcript, whatever Zoom's own web page shows you.

## 3. Activate it

**Activation** → **Activate your app**.

**A scope added after activation does nothing until you activate again.** Same
trap as the Slack reinstall. If a sync says a scope is missing, this is why.

## 4. Add the variables in Railway

The three values from step 1, on the **OneSpace app service** and the **cron
service** both.

## 5. Sync

**Meetings** → **Sync Zoom**. It reads from 1 August, same as the calendar.

Nothing else changes: meetings still need confirming before they become time,
and the duration box is simply pre-filled with the real length rather than the
booked one. Where the two differ, the card shows both.

---

## How commitments are found

The rules are in `src/lib/zoom/commitments.ts` and are meant to be read and
argued with.

**Only RevOptics speakers.** A client saying "I'll send the credentials" is
their promise, not yours.

**Only actual undertakings.** "I'll send over the instructions" yes. Questions,
negations ("I won't get to that"), hypotheticals ("I would start with the
audit"), conditionals ("if I get time I'll look"), turns of phrase ("I'll be
honest"), and things done in the call itself ("let me share my screen") are
all left alone.

**Precision over recall, deliberately.** A missed promise costs little — you
were on the call. A wrong one puts words in someone's mouth on a project plan,
and two of those and nobody trusts the feature. The rules lean toward saying
nothing.

Every one shows the sentence it came from, so you can check rather than trust.
Nothing becomes a task without someone pressing the button.

**The transcript comes first.** Where there's a transcript and
`ANTHROPIC_API_KEY` is set, Claude reads it and that is the write-up. Zoom's
own AI Companion next steps are the fallback for calls with no transcript —
useful, but they produce no write-up, only a list of steps.

Closed captions count as a transcript. They're the same WebVTT file produced
by live transcription rather than after the fact, so an account with captions
on and audio transcript off still gets read.

---

## When something doesn't work

**"Nobody in OneSpace matched a Zoom user"** — Zoom is matched by email. Their
Zoom account has to use the same address as their OneSpace one.

**"Zoom refused: … missing scope"** — step 2, then step 3. Adding a scope isn't
enough on its own.

**"Zoom doesn't recognise that account id"** — you've used a user id. The
Account ID is on the app's credentials page.

**Real durations aren't appearing** — the reports API needs a paid plan. On a
plan without it the sync says so rather than silently using booked times.

**"No transcript" on a call where you can see one in Zoom** — open the call in
**Meetings**, click into it, and press **Ask Zoom what it has**. It asks Zoom
live and prints every step: whether the recording exists, which files are on
it, whether the transcript downloads, and whether AI Companion has a summary.
The answer is nearly always one of: the app is missing
`cloud_recording:read:list_recording_files:admin`; the scope was added after
the app was activated and it hasn't been activated again; the call was
recorded to the laptop rather than the cloud; or Zoom hasn't finished
producing the file yet.

A call that couldn't be read is **not** marked as read — once the scope is
fixed, the next sync picks it up on its own. The reason is shown on the call
itself, under where the write-up would be.

**No commitments from a call that definitely had some** — check the meeting was
cloud recorded *with* transcription or captions enabled. Local recordings
aren't reachable by the API at all.

---

## Reading calls with Claude

Set `ANTHROPIC_API_KEY` in Railway, on the app service and the cron service,
and every synced call with a transcript gets read properly rather than
pattern-matched.

What you get per meeting: a few lines on what the call was about and what was
decided, stored on the meeting; and the action items, each with who owes it,
when they said, and the sentence it came from. Both sides are read — a client
saying "I'll get you the credentials" appears in the summary but never becomes
a RevOptics task.

**Cost.** An hour of talk is roughly 10,000 tokens in and a few hundred out.
On Opus that's a handful of cents a call; forty calls a month is a couple of
dollars. Priced at a level where the right answer is to use the good model.

**Without the key** nothing breaks — the old pattern rules run instead, and
the sync says which reader it used. They are the fallback, not the plan.
