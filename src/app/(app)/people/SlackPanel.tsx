"use client";

import { useActionState } from "react";
import { linkSlackAccountsAction } from "@/app/actions/slack";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";
import type { SlackStatus } from "@/app/actions/slack";

/**
 * Slack connection state, on the People page because the thing an admin
 * actually does here is match people to their Slack accounts.
 */
export function SlackPanel({ status }: { status: SlackStatus }) {
  const [state, action] = useActionState(
    async () => linkSlackAccountsAction(),
    {} as Awaited<ReturnType<typeof linkSlackAccountsAction>>,
  );

  return (
    <section className="card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink-900">Slack</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            status.connected
              ? "bg-good-50 text-good-700"
              : "bg-ink-100 text-ink-600"
          }`}
        >
          {status.connected ? (status.team ?? "Connected") : "Not connected"}
        </span>
      </div>

      {!status.configured ? (
        <p className="text-sm text-ink-500">
          Add <code className="text-xs">SLACK_BOT_TOKEN</code> and{" "}
          <code className="text-xs">SLACK_SIGNING_SECRET</code> in Railway, then
          reload this page.
        </p>
      ) : !status.connected ? (
        <p className="text-sm text-bad-700">
          Slack rejected the token{status.error ? `: ${status.error}` : "."} Check
          it hasn&apos;t been rotated.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-600">
            {status.linked} of {status.linked + status.unlinked.length} people are
            matched to a Slack account.
          </p>
          {status.unlinked.length > 0 ? (
            <p className="mt-1 text-xs text-ink-500">
              Not matched yet: {status.unlinked.join(", ")}
            </p>
          ) : null}

          <form action={action} className="mt-3 flex items-center gap-3">
            <SubmitButton pendingLabel="Matching…">
              Link Slack accounts
            </SubmitButton>
            {state?.message ? (
              <span className="text-xs text-ink-600">{state.message}</span>
            ) : null}
          </form>
          <ErrorNote message={state?.error} />

          <p className="mt-3 text-xs text-ink-500">
            Matching is by email, so someone&apos;s Slack profile has to use their
            RevOptics address. Re-run it whenever you add a person.
          </p>
        </>
      )}
    </section>
  );
}
