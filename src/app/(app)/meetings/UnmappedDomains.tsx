"use client";

import { useActionState, useState } from "react";
import {
  addClientDomainsAction,
  addIgnoredDomainsAction,
} from "@/app/actions/google";
import { toggleClientArchivedAction } from "@/app/actions/projects";
import { ComboBox } from "@/components/ComboBox";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export interface UnmappedRow {
  domain: string;
  meetings: number;
  example: string | null;
  people: string[];
  /** Attached to a client already — an archived one. A different fix. */
  archivedClientId: string | null;
  archivedClientName: string | null;
}

export interface ClientOption {
  id: string;
  name: string;
}

export interface SkippedRow {
  title: string;
  startsAt: Date;
  reason: string;
  code: string;
  personName: string;
}

/**
 * The meetings the sync passed over, and the one thing to do about each.
 *
 * A meeting is only stored when somebody in the invite is on a domain
 * mapped to a client. That is the right rule — a calendar carries far more
 * internal and prospect meetings than client ones — but it failed silently,
 * so a real client call with an unmapped domain simply wasn't there and
 * nothing on any screen said why.
 *
 * Two buttons per row, because there are exactly two true answers: this is a
 * client (say which), or it isn't (stop asking). Anything else is a list
 * that grows forever and gets ignored.
 */
export function UnmappedDomains({
  rows,
  clients,
  skipped,
  skippedTotal,
}: {
  rows: UnmappedRow[];
  clients: ClientOption[];
  /** The passed-over meetings themselves, newest first. */
  skipped: SkippedRow[];
  skippedTotal: number;
}) {
  const total = skippedTotal || rows.reduce((sum, r) => sum + r.meetings, 0);

  return (
    // No overflow-hidden: it clipped the client type-ahead's dropdown out of
    // existence — present in the DOM, invisible on the screen. The rounded
    // bottom is done on the inner panel instead.
    <details className="card group mb-4 border-warn-500/30 bg-warn-50/40 p-0">
      <summary className="flex cursor-pointer list-none items-baseline gap-2 px-4 py-3 hover:bg-warn-50 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="inline-block w-3 shrink-0 text-warn-700 transition-transform group-open:rotate-90"
        >
          ▸
        </span>
        <h2 className="text-sm font-semibold text-warn-700">
          {total.toLocaleString()} meeting{total === 1 ? "" : "s"} not shown
        </h2>
        <span className="text-xs text-ink-600">
          {rows.length === 0
            ? "open for what they were, and why"
            : `${rows.length} ${rows.length === 1 ? "company" : "companies"} in those invites ${rows.length === 1 ? "isn't" : "aren't"} being matched`}
        </span>
      </summary>

      <div className="rounded-b-xl border-t border-warn-500/20 bg-white">
        <p className="px-4 py-2 text-xs text-ink-600">
          A meeting is only kept when somebody in the invite is on a client&rsquo;s
          email domain — otherwise every internal call and recruiter chat would
          be in your list. Attach a company to a client and press Sync, and its
          meetings appear.
        </p>

        {rows.length > 0 ? (
          <ul className="divide-y divide-ink-100 border-t border-ink-100">
            {rows.map((row) => (
              <Row key={row.domain} row={row} clients={clients} />
            ))}
          </ul>
        ) : null}

        {/* The meetings themselves, by name.
            The list above is by company, which cannot describe a meeting
            that had nobody external in the invite — there is no company to
            file it under. That is the case that stayed invisible through
            three rounds of looking for it. */}
        {skipped.length > 0 ? (
          <div className="rounded-b-xl border-t border-ink-100">
            <p className="px-4 pt-3 pb-1 text-xs font-medium text-ink-700">
              What was passed over, and why
            </p>
            <ul className="divide-y divide-ink-100">
              {skipped.map((m, i) => (
                <li key={i} className="px-4 py-2 text-sm">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-ink-900">{m.title}</span>
                    <span className="text-xs text-ink-500">
                      {m.startsAt.toLocaleDateString("en-US", {
                        timeZone: "UTC",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {m.personName}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500">{m.reason}</p>
                </li>
              ))}
            </ul>
            {skippedTotal > skipped.length ? (
              <p className="px-4 py-2 text-xs text-ink-400">
                The {skipped.length} most recent of{" "}
                {skippedTotal.toLocaleString()}.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </details>
  );
}

function Row({ row, clients }: { row: UnmappedRow; clients: ClientOption[] }) {
  const [attachState, attach] = useActionState(addClientDomainsAction, {});
  const [ignoreState, ignore] = useActionState(addIgnoredDomainsAction, {});
  const [open, setOpen] = useState(false);

  /**
   * Already attached, to a client somebody archived.
   *
   * Archiving is meant to stop a finished client's meetings being suggested,
   * so this is working as intended right up to the moment it isn't — when
   * the client came back and nobody un-archived them. Telling somebody to
   * attach the domain here would be wrong twice: it is attached, and the
   * attach would be refused as a duplicate.
   */
  const archived = row.archivedClientName && row.archivedClientId;

  return (
    <li className="px-4 py-2.5 text-sm">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium text-ink-900">{row.domain}</span>
        <span className="text-xs text-ink-500">
          {row.meetings} meeting{row.meetings === 1 ? "" : "s"}
          {row.people.length > 0 ? ` · ${row.people.join(", ")}` : ""}
        </span>
        {row.example ? (
          <span className="w-full truncate text-xs text-ink-500 sm:w-auto">
            e.g. {row.example}
          </span>
        ) : null}

        <span className="ml-auto flex shrink-0 gap-2">
          {archived ? (
            <form action={toggleClientArchivedAction}>
              <input type="hidden" name="id" value={row.archivedClientId!} />
              <SubmitButton
                pendingLabel="Bringing back…"
                className="btn-secondary btn-sm"
              >
                Un-archive {row.archivedClientName}
              </SubmitButton>
            </form>
          ) : (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Cancel" : "This is a client"}
            </button>
          )}

          {/* Two separate forms, side by side and never nested: one deals
              with the client, the other says never ask again. */}
          {archived ? null : (
            <form action={ignore}>
              <input type="hidden" name="domains" value={row.domain} />
              <SubmitButton pendingLabel="Hiding…" className="btn-ghost btn-sm">
                Not a client
              </SubmitButton>
            </form>
          )}
        </span>
      </div>

      {archived ? (
        <p className="mt-1 text-xs text-warn-700">
          {row.domain} is already attached to {row.archivedClientName}, which is
          archived — so their meetings stop being suggested. Bring them back and
          press Sync.
        </p>
      ) : null}

      {open && !archived ? (
        <form action={attach} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="domains" value={row.domain} />
          <ComboBox
            name="clientId"
            required
            className="w-64"
            placeholder={`Which client is ${row.domain}?`}
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
          />
          <SubmitButton pendingLabel="Attaching…" className="btn-primary btn-sm">
            Attach
          </SubmitButton>
          <span className="text-xs text-ink-500">
            Then press Sync my calendar to pull the meetings in.
          </span>
        </form>
      ) : null}

      <ErrorNote message={attachState.error ?? ignoreState.error} />
    </li>
  );
}
