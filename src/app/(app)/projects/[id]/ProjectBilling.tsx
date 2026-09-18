"use client";

import { useRef } from "react";
import type { BillingType } from "@prisma/client";
import { BILLING_TYPES } from "@/components/BillingTypeField";
import { setProjectBillingAction } from "@/app/actions/projects";

/**
 * Whether this project is billable, on the project itself.
 *
 * It was only in the settings dialog, behind requireAdmin — so the people
 * running the work could see "Non-billable" on a project that plainly wasn't
 * and had no way to say so.
 *
 * Changing it also corrects the hours already logged, which is why the
 * confirmation says so out loud. A time entry remembers whether it was
 * billable when it was written, so without that the setting would change and
 * the revenue would stay at zero — a fix that looks like it worked.
 */
export function ProjectBilling({
  projectId,
  billingType,
  loggedHours,
}: {
  projectId: string;
  billingType: BillingType;
  /** Named in the confirmation, because this rewrites them. */
  loggedHours: number;
}) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={setProjectBillingAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={projectId} />
      <label className="sr-only" htmlFor={`billing-${projectId}`}>
        How this project earns
      </label>
      <select
        // Keyed on the value so React remounts it when the server sends a
        // new one. An uncontrolled select keeps whatever the DOM already
        // had, so after a successful change this still read "Non-billable"
        // while the database said Hourly — which reads as the change having
        // failed.
        key={billingType}
        id={`billing-${projectId}`}
        name="billingType"
        defaultValue={billingType}
        className="input w-auto py-1.5 text-sm"
        onChange={(e) => {
          const next = e.target.value as BillingType;
          const becomingBillable = next !== "NON_BILLABLE";
          const was = billingType !== "NON_BILLABLE";

          const willRewrite = becomingBillable !== was && loggedHours > 0;
          const ok =
            !willRewrite ||
            confirm(
              `${loggedHours}h already logged here will be marked ` +
                `${becomingBillable ? "billable" : "non-billable"}. ` +
                "Hours in closed months are left as they are.\n\nContinue?",
            );

          if (!ok) {
            e.target.value = billingType;
            return;
          }
          form.current?.requestSubmit();
        }}
      >
        {BILLING_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </form>
  );
}
