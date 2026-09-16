"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { createPartnerAeAction } from "@/app/actions/crm-people";
import type { Option } from "@/components/crm/FormFields";

/**
 * The partner AE: type to narrow, or add one without leaving the deal.
 *
 * A plain select was wrong once the partner accounts had more than a handful
 * of people on them - you cannot type "kra" into a dropdown of two hundred
 * and get Henry Krass. So: an input that filters as you type, a list of what
 * matches, and the id kept in a hidden field so the deal form submits
 * exactly what it did before.
 *
 * "Add new" replaces "nobody", because on this field the missing person is
 * nearly always somebody who exists and hasn't been typed in yet. Clearing
 * it is still possible - the × does that - but it is no longer the thing the
 * empty state invites you to do.
 *
 * The dialog is a div, not a form. A form inside the deal's form is invalid
 * HTML that fails silently, and this codebase has a check script for exactly
 * that bug. Saving calls the server action as a function instead.
 */
export function PartnerAePicker({
  name,
  label,
  value,
  options,
  partners,
  hint,
}: {
  name: string;
  label: string;
  value?: string | null;
  options: Option[];
  /** The partner accounts a new AE can belong to. */
  partners: Option[];
  hint?: string;
}) {
  const listId = useId();
  const [people, setPeople] = useState(options);
  const [chosen, setChosen] = useState<string | null>(value ?? null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const selected = people.find((p) => p.value === chosen) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people.slice(0, 50);
    return people.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 50);
  }, [people, query]);

  return (
    <div>
      <label className="label" htmlFor={`${listId}-input`}>
        {label}
      </label>

      <input type="hidden" name={name} value={chosen ?? ""} />

      {selected ? (
        <div className="flex items-center gap-2">
          <span className="input flex-1 bg-ink-50">{selected.label}</span>
          <button
            type="button"
            onClick={() => {
              setChosen(null);
              setQuery("");
            }}
            className="btn-ghost btn-sm"
            aria-label={`Clear ${label}`}
          >
            ×
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            id={`${listId}-input`}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            // A blur that fires before the click would close the list under
            // the pointer, so it waits a tick.
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Type a name…"
            className="input"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${listId}-list`}
            autoComplete="off"
          />

          {open ? (
            <ul
              id={`${listId}-list`}
              role="listbox"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
            >
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setAdding(true);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  + Add new AE
                </button>
              </li>

              {matches.length === 0 ? (
                <li className="px-3 py-2 text-sm text-ink-500">
                  {query.trim()
                    ? `Nobody matches “${query.trim()}”.`
                    : "No contacts on the partner accounts yet."}
                </li>
              ) : (
                matches.map((p) => (
                  <li key={p.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setChosen(p.value);
                        setOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm text-ink-900 hover:bg-ink-50"
                    >
                      {p.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}

      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}

      {adding ? (
        <AddAe
          partners={partners}
          onClose={() => setAdding(false)}
          onCreated={(option) => {
            setPeople((prev) =>
              prev.some((p) => p.value === option.value) ? prev : [...prev, option],
            );
            setChosen(option.value);
            setAdding(false);
          }}
        />
      ) : null}
    </div>
  );
}

function AddAe({
  partners,
  onClose,
  onCreated,
}: {
  partners: Option[];
  onClose: () => void;
  onCreated: (option: Option) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const read = (field: string) =>
    (box.current?.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-field="${field}"]`,
    )?.value ?? "");

  const save = () => {
    setError(null);
    start(async () => {
      const result = await createPartnerAeAction({
        firstName: read("firstName"),
        lastName: read("lastName"),
        title: read("title"),
        email: read("email"),
        phone: read("phone"),
        clientId: read("clientId"),
      });
      if (result.ok) onCreated({ value: result.id, label: result.label });
      else setError(result.error);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add a partner AE"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={box} className="card w-full max-w-lg p-5">
        <h2 className="mb-1 text-sm font-medium text-ink-900">Add a partner AE</h2>
        <p className="mb-4 text-xs text-ink-500">
          They become a contact on the partner&apos;s account, which is what an AE
          already is here.
        </p>

        {error ? (
          <p className="mb-3 rounded-lg border border-bad-500/30 bg-bad-50 px-3 py-2 text-sm text-bad-700">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Works for</label>
            <select data-field="clientId" className="input" defaultValue={partners[0]?.value ?? ""}>
              {partners.length === 0 ? <option value="">No partner accounts yet</option> : null}
              {partners.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">First name</label>
            <input data-field="firstName" className="input" autoFocus />
          </div>
          <div>
            <label className="label">Surname</label>
            <input data-field="lastName" className="input" />
          </div>
          <div>
            <label className="label">Title</label>
            <input data-field="title" className="input" placeholder="Account Executive" />
          </div>
          <div>
            <label className="label">Email</label>
            <input data-field="email" type="email" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Phone</label>
            <input data-field="phone" className="input" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={save} disabled={pending} className="btn-primary">
            {pending ? "Saving…" : "Add AE"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
