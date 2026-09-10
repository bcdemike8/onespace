"use client";

import { useActionState, useRef } from "react";
import {
  addPartnerDomainsAction,
  removePartnerDomainAction,
} from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * Domains that belong to a partner rather than a customer.
 *
 * Listing them stops a partner sitting in on a client call from reading as a
 * second client, which is the difference between that meeting matching and
 * matching nothing at all.
 */
export function PartnerDomainsField({
  partnerId,
  domains,
}: {
  partnerId: string;
  domains: { id: string; domain: string }[];
}) {
  const [state, action] = useActionState(
    addPartnerDomainsAction,
    {} as { error?: string; ok?: boolean },
  );
  const form = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {domains.map((d) => (
          <form key={d.id} action={removePartnerDomainAction} className="inline">
            <input type="hidden" name="id" value={d.id} />
            <button
              type="submit"
              title={`Remove ${d.domain}`}
              className="chip bg-ink-100 text-ink-700 hover:bg-bad-50 hover:text-bad-700"
            >
              {d.domain}
              <span aria-hidden className="text-ink-400">×</span>
              <span className="sr-only">Remove</span>
            </button>
          </form>
        ))}

        <form
          ref={form}
          action={(data) => {
            action(data);
            form.current?.reset();
          }}
          className="flex items-center gap-1.5"
        >
          <input type="hidden" name="partnerId" value={partnerId} />
          <input
            name="domains"
            className="input max-w-[11rem] py-0.5 text-xs"
            placeholder="outreach.io"
            aria-label="Add partner email domains"
          />
          <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
            Add
          </SubmitButton>
        </form>
      </div>
      <ErrorNote message={state?.error} />
    </div>
  );
}
