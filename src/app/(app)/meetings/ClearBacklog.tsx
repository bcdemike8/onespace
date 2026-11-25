"use client";

import { useActionState, useState } from "react";
import { dismissMeetingsBeforeAction } from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * One control for the backlog: set aside everything waiting from before a
 * day. Shown only when there is something old enough to be worth it, and it
 * says how many - person by person, when an admin is clearing the whole
 * team's - before you press it, because a bulk write-off you can't size up
 * first is one you won't trust.
 *
 * `days` is the calendar day of each waiting meeting in view, as YYYY-MM-DD
 * in the org's zone, so the count here matches what the server will do.
 */
export function ClearBacklog({
  show,
  days,
  defaultBefore,
  everyone,
}: {
  /**
   * Whether there is a backlog worth offering to clear. The page renders
   * this either way and lets it hide itself, so that once the clear has
   * emptied the backlog the "Set aside 40 meetings" confirmation is still
   * here to read - unmounted, it vanished along with the control.
   */
  show: boolean;
  days: { day: string; person: string }[];
  defaultBefore: string;
  /** An admin on the Everyone view: clears the whole team's, not just theirs. */
  everyone: boolean;
}) {
  const [before, setBefore] = useState(defaultBefore);
  const [state, action] = useActionState(dismissMeetingsBeforeAction, {} as {
    error?: string;
    message?: string;
  });

  const older = days.filter((d) => d.day < before);
  const count = older.length;
  const byPerson = [
    ...older.reduce((m, d) => m.set(d.person, (m.get(d.person) ?? 0) + 1), new Map<string, number>()),
  ].sort((a, b) => b[1] - a[1]);
  const breakdown = byPerson.map(([name, n]) => `${name} ${n}`).join(" · ");

  if (!show && !state.message && !state.error) return null;

  const whose = everyone ? "everyone's waiting meetings" : "everything of mine";

  return (
    <div className="mb-4 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-700">
      {state.message ? <p className="mb-2 text-ink-800">{state.message}</p> : null}
      <ErrorNote message={state.error} />
      {show ? (
        <form
          action={action}
          onSubmit={(e) => {
            const who = everyone ? `\n\n${breakdown}` : "";
            if (
              count === 0 ||
              !window.confirm(
                `Set aside ${count} meeting${count === 1 ? "" : "s"} from before ${before}?${who}`,
              )
            ) {
              e.preventDefault();
            }
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="scope" value={everyone ? "all" : "me"} />
          <span>Clear the backlog: set aside {whose} from before</span>
          <input
            type="date"
            name="before"
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            className="input w-auto py-1 text-sm"
            required
          />
          <SubmitButton pendingLabel="Setting aside…" className="btn-secondary btn-sm">
            {count === 0
              ? "Nothing before then"
              : `Set aside ${count} meeting${count === 1 ? "" : "s"}`}
          </SubmitButton>
          {everyone && count > 0 ? (
            <span className="w-full text-xs text-ink-600">{breakdown}</span>
          ) : null}
          <span className="w-full text-xs text-ink-500">
            Nothing is deleted. They show as Not billable under All
            {everyone ? " on each person's Meetings tab" : ""}, and any of them
            can still be logged with &ldquo;Log it after all&rdquo;.
          </span>
        </form>
      ) : null}
    </div>
  );
}
