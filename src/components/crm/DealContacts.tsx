"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  addDealContactAction,
  removeDealContactAction,
} from "@/app/actions/crm-records";
import { ROLE_SUGGESTIONS } from "@/lib/crm/contact-roles";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export interface DealContactRow {
  id: string;
  contactId: string | null;
  name: string;
  email: string | null;
  title: string | null;
  role: string | null;
  isPrimary: boolean;
}

export interface ContactChoice {
  value: string;
  label: string;
}

/**
 * Who is who on this deal — Salesforce's Contact Roles, with the step that
 * was missing.
 *
 * You could already point a deal at a contact, but only one that existed.
 * Adding the person you just met meant leaving the deal, creating them under
 * Contacts, coming back and picking them — four screens — so in practice the
 * billing contact stayed in an email thread.
 *
 * Both routes are here: pick somebody already on the account, or type the
 * name and email you have. A role of "Billing Contact" fills the deal's
 * billing contact field at the same time, because those are one fact.
 */
export function DealContacts({
  dealId,
  rows,
  choices,
}: {
  dealId: string;
  rows: DealContactRow[];
  /** Everybody already on this account. */
  choices: ContactChoice[];
}) {
  const [state, action] = useActionState(addDealContactAction, {});
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">(
    choices.length ? "existing" : "new",
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  return (
    <section className="card">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink-900">
          Contact roles <span className="font-normal text-ink-400">({rows.length})</span>
        </h2>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Cancel" : "Add"}
        </button>
      </div>

      {rows.length === 0 && !open ? (
        <p className="px-4 pb-3 text-sm text-ink-400">
          Nobody yet. Add the billing contact and whoever signs.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="divide-y divide-ink-100 border-t border-ink-100">
          {rows.map((r) => (
            <li key={r.id} className="group flex gap-2 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  {r.contactId ? (
                    <Link
                      href={`/crm/contacts/${r.contactId}`}
                      className="text-sm text-ink-900 underline"
                    >
                      {r.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-ink-500">
                      No longer in the contacts
                    </span>
                  )}
                  {r.isPrimary ? (
                    <span className="chip bg-brand-100 text-brand-700">Primary</span>
                  ) : null}
                </div>
                <p className="text-xs text-ink-500">
                  {[r.role, r.title].filter(Boolean).join(" · ") || "No role"}
                </p>
                {r.email ? (
                  <a
                    href={`mailto:${r.email}`}
                    className="text-xs text-ink-500 underline hover:text-ink-900"
                  >
                    {r.email}
                  </a>
                ) : null}
              </div>
              <form action={removeDealContactAction}>
                <input type="hidden" name="id" value={r.id} />
                <button
                  type="submit"
                  aria-label={`Take ${r.name} off this deal`}
                  title="Take them off this deal"
                  className="px-1 text-ink-400 opacity-0 transition-opacity hover:text-bad-700 group-hover:opacity-100"
                >
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <form
          ref={formRef}
          action={action}
          className="space-y-3 border-t border-ink-200 p-4"
        >
          <input type="hidden" name="dealId" value={dealId} />

          {choices.length > 0 ? (
            <div className="flex gap-1 rounded-lg bg-ink-100 p-0.5 text-xs">
              {(["existing", "new"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`flex-1 rounded-md px-2 py-1.5 transition-colors ${
                    mode === m
                      ? "bg-white font-medium text-ink-900 shadow-sm"
                      : "text-ink-600 hover:text-ink-900"
                  }`}
                >
                  {m === "existing" ? "On this account" : "Someone new"}
                </button>
              ))}
            </div>
          ) : null}

          {/* The unused half is removed, not hidden: a disabled select still
              posts its value, and a stale contactId would silently win over
              the name somebody just typed. */}
          {mode === "existing" && choices.length > 0 ? (
            <div>
              <label className="label" htmlFor="dc-contact">
                Contact
              </label>
              <select id="dc-contact" name="contactId" className="input" required>
                <option value="">Choose someone…</option>
                {choices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="dc-first">
                    First name
                  </label>
                  <input id="dc-first" name="firstName" className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="dc-last">
                    Surname
                  </label>
                  <input id="dc-last" name="lastName" className="input" required />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="dc-email">
                  Email
                </label>
                <input id="dc-email" name="email" type="email" className="input" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="dc-title">
                    Title
                  </label>
                  <input id="dc-title" name="title" className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="dc-phone">
                    Phone
                  </label>
                  <input id="dc-phone" name="phone" className="input" />
                </div>
              </div>
              <p className="text-xs text-ink-500">
                They&apos;ll be added to this account&apos;s contacts. If that email
                is already there, the existing person is used instead of a second
                copy.
              </p>
            </div>
          )}

          <div>
            <label className="label" htmlFor="dc-role">
              Role
            </label>
            <input
              id="dc-role"
              name="role"
              className="input"
              list="dc-roles"
              placeholder="Billing Contact"
            />
            <datalist id="dc-roles">
              {ROLE_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-ink-500">
              Say “Billing Contact” and the deal&apos;s billing contact is set too.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" name="isPrimary" />
            Primary contact on this deal
          </label>

          <ErrorNote message={state.error} />

          <SubmitButton pendingLabel="Adding…">Add to deal</SubmitButton>
        </form>
      ) : null}
    </section>
  );
}
