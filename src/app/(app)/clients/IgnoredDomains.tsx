"use client";

import { useActionState, useRef } from "react";
import {
  addIgnoredDomainsAction,
  removeIgnoredDomainAction,
} from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * Domains to stop being reminded about.
 *
 * After a sync, OneSpace names the outside domains it saw that aren't mapped
 * to anyone — that's how a new client's domain gets noticed. Recruiters,
 * vendors and the consultancy you swap referrals with would otherwise sit in
 * that list forever. This is how you tell it you've already decided.
 */
export function IgnoredDomains({
  domains,
}: {
  domains: { id: string; domain: string; note: string | null }[];
}) {
  const [state, action] = useActionState(
    addIgnoredDomainsAction,
    {} as { error?: string; ok?: boolean },
  );
  const form = useRef<HTMLFormElement>(null);

  return (
    <section className="card p-4">
      <h2 className="text-sm font-semibold text-ink-900">Ignored domains</h2>
      <p className="mt-1 text-xs text-ink-500">
        After each sync OneSpace names the unmapped domains it saw, so a new
        client gets noticed. Anything here is left out of that list.
      </p>

      {domains.length > 0 ? (
        <ul className="mt-3 grid gap-1">
          {domains.map((d) => (
            <li key={d.id} className="flex items-baseline gap-2 text-sm">
              <span className="text-ink-800">{d.domain}</span>
              {d.note ? (
                <span className="text-xs text-ink-500">{d.note}</span>
              ) : null}
              <form action={removeIgnoredDomainAction} className="ml-auto">
                <input type="hidden" name="id" value={d.id} />
                <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
                  Remove
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-400">Nothing ignored yet.</p>
      )}

      <form
        ref={form}
        action={(data) => {
          action(data);
          form.current?.reset();
        }}
        className="mt-3 flex flex-wrap items-end gap-2"
      >
        <div className="min-w-[10rem] flex-1">
          <label className="label" htmlFor="ignore-domains">
            Domains
          </label>
          <input
            id="ignore-domains"
            name="domains"
            className="input py-1 text-sm"
            placeholder="recruiters.com, vendor.io"
          />
        </div>
        <div className="min-w-[8rem] flex-1">
          <label className="label" htmlFor="ignore-note">
            Why <span className="font-normal text-ink-400">optional</span>
          </label>
          <input
            id="ignore-note"
            name="note"
            className="input py-1 text-sm"
            placeholder="never billable"
          />
        </div>
        <SubmitButton pendingLabel="Adding…" className="btn-secondary">
          Ignore
        </SubmitButton>
      </form>

      <ErrorNote message={state?.error} />
    </section>
  );
}
