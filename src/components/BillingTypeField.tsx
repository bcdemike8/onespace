import type { BillingType } from "@prisma/client";

export const BILLING_TYPES: {
  value: BillingType;
  label: string;
  hint: string;
}[] = [
  {
    value: "HOURLY",
    label: "Hourly",
    hint: "Invoiced on the hours. Revenue is hours × bill rate.",
  },
  {
    value: "FIXED_FEE",
    label: "Fixed fee",
    hint: "Invoiced at an agreed price. Revenue is the budget amount, however long it takes.",
  },
  {
    value: "NON_BILLABLE",
    label: "Non-billable",
    hint: "Internal work, training, goodwill. Time is tracked but never invoiced.",
  },
];

export const BILLING_TYPE_LABEL: Record<BillingType, string> =
  Object.fromEntries(BILLING_TYPES.map((t) => [t.value, t.label])) as Record<
    BillingType,
    string
  >;

/**
 * How the project earns. This isn't cosmetic: a non-billable project forces
 * every hour logged to it non-billable, and a fixed-fee project reports the
 * fee as revenue instead of hours × rate.
 */
export function BillingTypeField({
  defaultValue = "HOURLY",
  id = "billingType",
}: {
  defaultValue?: BillingType;
  id?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        Billing
      </label>
      <select id={id} name="billingType" defaultValue={defaultValue} className="input">
        {BILLING_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-ink-500">
        Non-billable forces every hour logged here non-billable. Fixed fee
        reports the budget amount as revenue instead of hours × rate.
      </p>
    </div>
  );
}

/** Small inline badge for lists and headers. */
export function BillingTypeBadge({ type }: { type: BillingType }) {
  if (type === "HOURLY") return null; // the default — not worth the noise
  return (
    <span
      className={
        type === "NON_BILLABLE"
          ? "rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600"
          : "rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800"
      }
    >
      {BILLING_TYPE_LABEL[type]}
    </span>
  );
}
