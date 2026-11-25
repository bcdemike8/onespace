"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  acceptCommitmentAction,
  dismissCommitmentsAction,
} from "@/app/actions/zoom";
import { SubmitButton } from "@/components/SubmitButton";
import { CappedList } from "@/components/CappedList";
import { ErrorNote } from "@/components/ui";
import {
  queueCount,
  type QueueGroup,
  type QueueItem,
  type QueueSourceKind,
} from "@/lib/commitments/queue";

export interface QueueProject {
  id: string;
  name: string;
  clientName: string | null;
}

type State = { error?: string; ok?: boolean; message?: string };

/** "Fri 27 Nov", for a promised date held as YYYY-MM-DD. */
const promised = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${iso}T00:00:00Z`));

const WHERE: Record<QueueSourceKind, string> = {
  AI_SUMMARY: "From the call",
  TRANSCRIPT: "You said this on the call",
  ZOOM_SUMMARY: "From Zoom's summary of the call",
  RECAP_EMAIL: "You wrote this in the recap",
};

/**
 * What you undertook on calls and in recaps, waiting to become work.
 *
 * Each consultant's own: the things they agreed to deliver to a client or do
 * on a client's behalf, from the last two weeks, grouped by the project they
 * belong to. Nothing here is a task until its owner says so - Add it puts it
 * on the project, assigned to them; Not a task, or Clear all for a whole
 * project, takes it off this list for good.
 */
export function DayQueue({
  groups,
  projects,
}: {
  groups: QueueGroup[];
  projects: QueueProject[];
}) {
  const total = queueCount(groups);

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
          You said you&apos;d do this
        </h2>
        <span className="text-xs text-ink-500 tnum">
          {total} {total === 1 ? "item" : "items"} · last two weeks
        </span>
      </div>

      {total === 0 ? (
        <p className="card px-4 py-3 text-sm text-ink-500">
          Nothing waiting. What you agree to do on client calls and in recap
          emails shows up here, for you to add as a task or clear.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <ProjectGroup key={group.key} group={group} projects={projects} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectGroup({
  group,
  projects,
}: {
  group: QueueGroup;
  projects: QueueProject[];
}) {
  const [state, clear] = useActionState(dismissCommitmentsAction, {} as State);
  const label = group.projectName
    ? `${group.clientName ? `${group.clientName} — ` : ""}${group.projectName}`
    : "Not filed to a project yet";
  const ids = group.items.flatMap((i) => i.ids);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-ink-200 bg-ink-50 px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-700">
          {group.projectId ? (
            <Link href={`/projects/${group.projectId}`} className="hover:text-brand-700">
              {label}
            </Link>
          ) : (
            label
          )}
        </h3>
        <span className="text-xs text-ink-500 tnum">{group.items.length}</span>
        <form
          action={clear}
          className="ml-auto"
          onSubmit={(e) => {
            const n = group.items.length;
            if (
              !window.confirm(
                `Clear ${n === 1 ? "this item" : `all ${n} items`} from ${label}? ${
                  n === 1 ? "It won't" : "They won't"
                } become tasks, and won't come back.`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          {ids.map((id) => (
            <input key={id} type="hidden" name="id" value={id} />
          ))}
          <SubmitButton pendingLabel="Clearing…" className="btn-ghost btn-sm">
            Clear all
          </SubmitButton>
        </form>
      </div>
      {state?.error ? (
        <div className="px-4 pt-2">
          <ErrorNote message={state.error} />
        </div>
      ) : null}
      <CappedList visible={5} className="divide-y divide-ink-100">
        {group.items.map((item) => (
          <QueueRow key={item.ids[0]} item={item} projects={projects} />
        ))}
      </CappedList>
    </div>
  );
}

function QueueRow({
  item,
  projects,
}: {
  item: QueueItem;
  projects: QueueProject[];
}) {
  const [state, action] = useActionState(acceptCommitmentAction, {} as State);
  const [showSaid, setShowSaid] = useState(false);
  const rowId = item.ids[0];

  return (
    <li className="px-4 py-3">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Two sibling forms, not nested: a form inside a form is invalid
              HTML and the browser's parser drops the inner one. `display:
              contents` lets both sets of controls sit on the same row. */}
          <form action={action} className="contents">
            {item.ids.map((id) => (
              <input key={id} type="hidden" name="id" value={id} />
            ))}
            <input
              id={`n-${rowId}`}
              name="name"
              defaultValue={item.title}
              aria-label="Task name"
              className="input min-w-[11rem] flex-1 py-1 text-sm"
              maxLength={200}
            />
            <label className="sr-only" htmlFor={`d-${rowId}`}>
              Due
            </label>
            <input
              id={`d-${rowId}`}
              name="dueDate"
              type="date"
              defaultValue={item.dueDate ?? ""}
              className="input w-[8.5rem] shrink-0 py-1 text-sm tnum"
              title={
                item.dueDate
                  ? "The date that was promised - change it if you need to"
                  : "No date was given. Pick one if you want the task to have a due date, or leave it blank."
              }
            />
            <label className="sr-only" htmlFor={`p-${rowId}`}>
              Project
            </label>
            <select
              id={`p-${rowId}`}
              name="projectId"
              defaultValue={item.projectId ?? ""}
              className="input w-[11rem] shrink-0 py-1 text-sm"
              required
            >
              <option value="">Which project?</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.clientName ? `${p.clientName} — ` : ""}
                  {p.name}
                </option>
              ))}
            </select>
            <SubmitButton pendingLabel="Adding…" className="btn-primary btn-sm">
              Add it
            </SubmitButton>
          </form>
          <DismissButton ids={item.ids} />
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          <span>{WHERE[item.source]}</span>
          <span aria-hidden="true">·</span>
          {item.originHref ? (
            <Link href={item.originHref} className="hover:text-ink-800 hover:underline">
              {item.originLabel}
            </Link>
          ) : (
            <span>{item.originLabel}</span>
          )}
          {item.calls > 1 ? (
            <>
              <span aria-hidden="true">·</span>
              <span>said on {item.calls} calls</span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          {item.dueDate ? (
            <span>Promised for {promised(item.dueDate)}</span>
          ) : (
            <span className="text-warn-700">No date given</span>
          )}
          <button
            type="button"
            onClick={() => setShowSaid((v) => !v)}
            className="ml-auto text-ink-500 underline decoration-ink-300 hover:text-ink-800"
          >
            {showSaid ? "Hide" : "What was said"}
          </button>
        </div>

        {showSaid ? (
          <div className="grid gap-1 border-l-2 border-ink-200 pl-2 text-xs text-ink-600">
            <p className="italic">&ldquo;{item.quote}&rdquo;</p>
            {item.detail && item.detail !== item.title ? <p>{item.detail}</p> : null}
          </div>
        ) : null}

        <ErrorNote message={state?.error} />
      </div>
    </li>
  );
}

function DismissButton({ ids }: { ids: string[] }) {
  const [state, action] = useActionState(dismissCommitmentsAction, {} as State);
  return (
    <form action={action} className="contents">
      {ids.map((id) => (
        <input key={id} type="hidden" name="id" value={id} />
      ))}
      <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
        Not a task
      </SubmitButton>
      {state?.error ? <ErrorNote message={state.error} /> : null}
    </form>
  );
}
