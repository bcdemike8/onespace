"use client";

import { useActionState, useState } from "react";
import { setDealStageAction } from "@/app/actions/crm-records";
import { SubmitButton } from "@/components/SubmitButton";
import type { StageStep } from "@/lib/crm/view";

/**
 * The stage path, clickable.
 *
 * Click a stage and nothing happens yet: it goes amber, a bar appears saying
 * what moving there would do, and Save does it. One click moving a deal
 * would be quicker and wrong - the path is the widest, most clickable thing
 * on the page, and a mis-click that silently marks a deal Closed Won is a
 * number in a board pack nobody can explain.
 *
 * Closing a deal is not on the path. Won and lost are consequential in a way
 * "Discovery to Proposal" is not - they move revenue - so they are two
 * deliberate buttons underneath rather than the far end of a row you are
 * already clicking along. Salesforce reached the same conclusion and called
 * it "Change Closed Stage".
 */
export function StagePath({
  dealId,
  current,
  path,
  isClosed,
  isWon,
}: {
  dealId: string;
  current: string;
  path: StageStep[];
  isClosed: boolean;
  isWon: boolean;
}) {
  const [state, submit] = useActionState(setDealStageAction, {});
  const [picked, setPicked] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const label = (stage: string) =>
    path.find((s) => s.stage === stage)?.label ??
    (stage === "CLOSED_WON" ? "Closed Won" : "Closed Lost");

  const pending = picked && picked !== current ? picked : null;

  return (
    <div>
      <ol className="flex flex-wrap gap-1">
        {path.map((step) => {
          const isPending = pending === step.stage;
          const closedEnding = step.stage === "CLOSED_WON" || step.stage === "CLOSED_LOST";

          return (
            <li key={step.stage} className="flex-1">
              <button
                type="button"
                // The ending isn't clickable here: closing is the pair of
                // buttons below, where it can say what it will do.
                disabled={closedEnding}
                onClick={() => setPicked(step.stage)}
                aria-current={step.stage === current ? "step" : undefined}
                className={`w-full rounded px-2 py-1.5 text-center text-[11px] whitespace-nowrap transition-colors ${
                  isPending
                    ? "bg-warn-500 font-medium text-white"
                    : step.state === "current"
                      ? current === "CLOSED_LOST"
                        ? "bg-ink-700 font-medium text-white"
                        : "bg-brand-600 font-medium text-white"
                      : step.state === "done"
                        ? "bg-brand-100 text-brand-700 hover:bg-brand-200"
                        : "bg-ink-50 text-ink-400 hover:bg-ink-100"
                } ${closedEnding ? "cursor-default" : "cursor-pointer"}`}
              >
                {step.state === "done" && !isPending ? `✓ ${step.label}` : step.label}
              </button>
            </li>
          );
        })}
      </ol>

      {state.error ? (
        <p className="mt-3 rounded-lg border border-bad-500/30 bg-bad-50 px-3 py-2 text-sm text-bad-700">
          {state.error}
        </p>
      ) : null}

      {pending ? (
        <form action={submit} className="mt-3 rounded-lg border border-warn-500/30 bg-warn-50 p-3">
          <input type="hidden" name="id" value={dealId} />
          <input type="hidden" name="stage" value={pending} />
          <p className="text-sm text-warn-800">
            Move to <strong>{label(pending)}</strong>?
            {isClosed ? " This reopens the deal." : ""}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <SubmitButton className="btn-primary btn-sm">Save</SubmitButton>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <ClosingButtons
          dealId={dealId}
          current={current}
          isClosed={isClosed}
          isWon={isWon}
          reason={reason}
          setReason={setReason}
          submit={submit}
        />
      )}
    </div>
  );
}

function ClosingButtons({
  dealId,
  current,
  isClosed,
  isWon,
  reason,
  setReason,
  submit,
}: {
  dealId: string;
  current: string;
  isClosed: boolean;
  isWon: boolean;
  reason: string;
  setReason: (v: string) => void;
  submit: (form: FormData) => void;
}) {
  const [closing, setClosing] = useState<"CLOSED_WON" | "CLOSED_LOST" | null>(null);

  if (closing) {
    const won = closing === "CLOSED_WON";
    return (
      <form
        action={submit}
        className={`mt-3 rounded-lg border p-3 ${
          won ? "border-brand-500/30 bg-brand-50" : "border-ink-300 bg-ink-50"
        }`}
      >
        <input type="hidden" name="id" value={dealId} />
        <input type="hidden" name="stage" value={closing} />
        <p className="text-sm text-ink-800">
          Mark this <strong>{won ? "Closed Won" : "Closed Lost"}</strong>?{" "}
          {won
            ? "It counts as revenue from its close date, and probability becomes 100%."
            : "It leaves the pipeline and probability becomes 0%."}
        </p>

        {!won ? (
          <div className="mt-2">
            <label className="label" htmlFor="lostReason">
              Why (optional, and worth it)
            </label>
            <input
              id="lostReason"
              name="lostReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Budget, timing, went with someone else…"
              className="input"
            />
            <p className="mt-1 text-xs text-ink-500">
              A lost deal with no reason is one the lost-reason report can&apos;t
              use.
            </p>
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-2">
          <SubmitButton className="btn-primary btn-sm">
            {won ? "Mark Closed Won" : "Mark Closed Lost"}
          </SubmitButton>
          <button
            type="button"
            onClick={() => setClosing(null)}
            className="btn-secondary btn-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {current === "CLOSED_WON" ? null : (
        <button
          type="button"
          onClick={() => setClosing("CLOSED_WON")}
          className="btn-secondary btn-sm"
        >
          Mark Closed Won
        </button>
      )}
      {current === "CLOSED_LOST" ? null : (
        <button
          type="button"
          onClick={() => setClosing("CLOSED_LOST")}
          className="btn-secondary btn-sm"
        >
          Mark Closed Lost
        </button>
      )}
      {isClosed ? (
        <span className="text-xs text-ink-500">
          {isWon ? "Won" : "Lost"} — pick a stage above to reopen it.
        </span>
      ) : null}
    </div>
  );
}
