"use client";

import { useActionState, useState } from "react";
import { importSfdcAction, type CrmImportState } from "@/app/actions/crm";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

type Step = {
  key: string;
  file: string;
  title: string;
  why: string;
  needsRecordTypes?: boolean;
};

/**
 * The order matters and the page says so, because a contact loaded before
 * its account has nowhere to attach and quietly arrives orphaned.
 */
const STEPS: Step[] = [
  {
    key: "people",
    file: "User.csv",
    title: "People",
    why: "Matches Salesforce users to OneSpace accounts by email, so owners and consultants come through as real people rather than ids. Everything below depends on it.",
  },
  {
    key: "accounts",
    file: "Account.csv",
    title: "Accounts",
    why: "1,037 companies. Prospects, customers, partners — all of them, filed by type. Existing clients you typed in by hand are matched by name and kept, not duplicated.",
    needsRecordTypes: true,
  },
  {
    key: "products",
    file: "Product2.csv",
    title: "Products",
    why: "The catalogue, including the link to each product's statement of work.",
  },
  {
    key: "contacts",
    file: "Contact.csv",
    title: "Contacts",
    why: "7,485 people, attached to their accounts. Run Accounts first or they arrive with nowhere to go.",
  },
  {
    key: "deals",
    file: "Opportunity.csv",
    title: "Deals",
    why: "1,269 deals with their amounts, close dates and outcomes. Needs Accounts and Contacts already loaded.",
    needsRecordTypes: true,
  },
  {
    key: "lines",
    file: "OpportunityLineItem.csv",
    title: "What was sold",
    why: "The products on each deal. Needs Deals and Products already loaded.",
  },
];

function Report({ state }: { state: CrmImportState }) {
  if (state.error) return <ErrorNote message={state.error} />;
  if (!state.report) return null;

  const r = state.report;
  return (
    <div className="mt-3 rounded-lg bg-ink-50 p-3 text-xs leading-relaxed text-ink-700">
      <p>
        <strong className="font-medium text-ink-900">
          {r.rows.toLocaleString()} rows read
        </strong>
        {" — "}
        {r.created.toLocaleString()} created, {r.updated.toLocaleString()} updated
        {r.skipped > 0 ? `, ${r.skipped.toLocaleString()} skipped` : ""}.
      </p>
      {r.notes.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-warn-700">
          {r.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StepCard({
  step,
  recordTypes,
}: {
  step: Step;
  recordTypes: string | null;
}) {
  const [csv, setCsv] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [state, action] = useActionState(importSfdcAction, {} as CrmImportState);

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-sm font-medium text-ink-900">{step.title}</h2>
        <code className="text-xs text-ink-500">{step.file}</code>
      </div>
      <p className="mt-1 mb-3 text-sm leading-relaxed text-ink-600">{step.why}</p>

      <input
        type="file"
        accept=".csv,text/csv"
        className="input mb-3 file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-700"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setCsv(await file.text());
          setName(file.name);
        }}
      />

      <form action={action}>
        <input type="hidden" name="step" value={step.key} />
        <input type="hidden" name="csv" value={csv ?? ""} />
        {step.needsRecordTypes ? (
          <input type="hidden" name="recordTypes" value={recordTypes ?? ""} />
        ) : null}
        <SubmitButton
          pendingLabel="Loading…"
          className={csv ? "btn-primary" : "btn-ghost"}
        >
          {name ? `Load ${name}` : "Choose a file first"}
        </SubmitButton>
      </form>

      <Report state={state} />
    </li>
  );
}

export function ImportSfdc() {
  // Shared across the two steps that need it, so it is chosen once.
  const [recordTypes, setRecordTypes] = useState<string | null>(null);
  const [rtName, setRtName] = useState<string | null>(null);

  return (
    <div>
      <div className="card mb-4 p-4">
        <h2 className="text-sm font-medium text-ink-900">
          RecordType.csv <span className="text-ink-500">— optional</span>
        </h2>
        <p className="mt-1 mb-3 text-sm leading-relaxed text-ink-600">
          Tells the import what your record types are called, so accounts land
          as Prospect or Current Customer rather than being guessed at. Without
          it the import uses the ids from your own org, which works until
          somebody rebuilds them.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          className="input file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-700"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setRecordTypes(await file.text());
            setRtName(file.name);
          }}
        />
        {rtName ? (
          <p className="mt-2 text-xs text-ink-600">
            Loaded <strong className="font-medium">{rtName}</strong>
          </p>
        ) : null}
      </div>

      <ol className="space-y-3">
        {STEPS.map((step) => (
          <StepCard key={step.key} step={step} recordTypes={recordTypes} />
        ))}
      </ol>
    </div>
  );
}
