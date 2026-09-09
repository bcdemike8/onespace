"use client";

import { useActionState, useRef } from "react";
import { addClientDomainsAction, removeClientDomainAction } from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * The email domains that mean "this client".
 *
 * This is the one piece of setup the whole Google integration rests on: a
 * meeting or an email is matched to a client by the domain its people are on.
 * A client with no domain here still works, it just never matches
 * automatically.
 */
export function DomainsField({
  clientId,
  domains,
}: {
  clientId: string;
  domains: { id: string; domain: string }[];
}) {
  const [state, action] = useActionState(addClientDomainsAction, {} as { error?: string; ok?: boolean });
  const form = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-3 border-t border-ink-100 pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-ink-600">Email domains</span>

        {domains.length === 0 ? (
          <span className="text-xs text-ink-400">
            none — meetings and mail from this client won&apos;t match automatically
          </span>
        ) : (
          domains.map((d) => (
            <form key={d.id} action={removeClientDomainAction} className="inline">
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
          ))
        )}
      </div>

      <form
        ref={form}
        action={(data) => {
          action(data);
          form.current?.reset();
        }}
        className="mt-2 flex items-center gap-2"
      >
        <input type="hidden" name="clientId" value={clientId} />
        <input
          name="domains"
          className="input max-w-xs py-1 text-xs"
          placeholder="acme.com, acme.co.uk"
          aria-label="Add email domains"
        />
        <SubmitButton pendingLabel="Adding…" className="btn-ghost btn-sm">
          Add
        </SubmitButton>
      </form>

      <ErrorNote message={state?.error} />
    </div>
  );
}
