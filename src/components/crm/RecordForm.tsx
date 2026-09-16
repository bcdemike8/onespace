"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";
import type { SaveState } from "@/app/actions/crm-records";

/**
 * The shell every CRM form sits in.
 *
 * One client component, so the four forms themselves stay server-rendered:
 * the fields are plain inputs and only the wrapper needs to know whether a
 * save failed. That keeps the JavaScript this page ships to roughly nothing,
 * which matters on a form with sixty fields.
 *
 * Save appears twice, top and bottom. A Salesforce-shaped record page is
 * taller than a screen, and a Save button only at the end means scrolling
 * past everything you just changed to reach it.
 */
export function RecordForm({
  action,
  cancelHref,
  saveLabel = "Save",
  children,
}: {
  action: (state: SaveState, form: FormData) => Promise<SaveState>;
  cancelHref: string;
  saveLabel?: string;
  children: React.ReactNode;
}) {
  const [state, submit] = useActionState(action, {});

  return (
    <form action={submit}>
      <div className="mb-4 flex items-center gap-2">
        <SubmitButton>{saveLabel}</SubmitButton>
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
      </div>

      <ErrorNote message={state.error} />

      {children}

      <div className="mt-4 flex items-center gap-2">
        <SubmitButton>{saveLabel}</SubmitButton>
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
