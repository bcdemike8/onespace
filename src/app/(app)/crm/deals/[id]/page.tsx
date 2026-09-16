import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import { STAGE_LABEL, money } from "@/lib/crm/view";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * One deal, whole.
 *
 * Salesforce spread this across a page of collapsed sections; here it is
 * four groups in the order somebody actually asks about them - who and how
 * much, what was sold, how it went, and the money. Anything Salesforce held
 * and never filled in simply isn't shown: a screen of "—" teaches nobody
 * anything, and the fields that are empty are empty on every deal.
 */
export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const deal = await db.deal.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, accountType: true } },
      partner: { select: { name: true } },
      owner: { select: { name: true } },
      leadConsultant: { select: { name: true } },
      secondaryConsultant: { select: { name: true } },
      primaryContact: { select: { id: true, firstName: true, lastName: true, email: true, title: true } },
      billingContact: { select: { id: true, firstName: true, lastName: true, email: true } },
      partnerAe: { select: { id: true, firstName: true, lastName: true, email: true, title: true } },
      createdBy: { select: { name: true } },
      contactRoles: {
        orderBy: [{ isPrimary: "desc" }, { role: "asc" }],
        select: {
          id: true,
          role: true,
          isPrimary: true,
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
      project: { select: { id: true, name: true, status: true } },
      lines: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          product: { select: { id: true, name: true, delivery: true, sowUrl: true } },
        },
      },
    },
  });

  if (!deal) notFound();

  const person = (p: { firstName: string | null; lastName: string } | null) =>
    p ? [p.firstName, p.lastName].filter(Boolean).join(" ") : null;

  const who: Row[] = [
    { label: "Client", value: deal.client.name, href: `/crm/${deal.client.id}` },
    { label: "Owner", value: deal.owner?.name ?? null },
    {
      label: "Partner AE",
      value: person(deal.partnerAe),
      note: deal.partnerAe?.title ?? deal.partnerAe?.email ?? undefined,
    },
    { label: "Platform", value: deal.partner?.name ?? "Direct" },
    { label: "Business type", value: deal.businessType },
    { label: "Record type", value: deal.type === "PARTNER" ? "Partner" : "Direct" },
    { label: "Lead source", value: deal.leadSource },
    {
      label: "Primary contact",
      value: person(deal.primaryContact),
      note: deal.primaryContact?.title ?? deal.primaryContact?.email ?? undefined,
    },
    { label: "Billing contact", value: person(deal.billingContact) },
  ];

  const delivery: Row[] = [
    { label: "Lead consultant", value: deal.leadConsultant?.name ?? null },
    { label: "Second consultant", value: deal.secondaryConsultant?.name ?? null },
    {
      label: "Project dates",
      value:
        deal.projectStartDate || deal.projectCompletionDate
          ? `${deal.projectStartDate ? formatMedium(deal.projectStartDate) : "?"} → ${
              deal.projectCompletionDate ? formatMedium(deal.projectCompletionDate) : "?"
            }`
          : null,
    },
    { label: "Subcontract", value: deal.subcontract ? "Yes" : null },
    { label: "Partner hold", value: deal.partnerHold ? "Yes" : null },
    { label: "Performance Pulse", value: deal.performancePulse ? "Opted in" : null },
    { label: "Next step", value: deal.nextStep },
  ];

  const moneyRows: Row[] = [
    {
      label: "Expected revenue",
      value:
        deal.expectedRevenue === null
          ? null
          : money(Number(deal.expectedRevenue)),
      note:
        deal.probability === null ? undefined : `at ${deal.probability}% probability`,
    },
    { label: "Forecast category", value: deal.forecastCategory },
    {
      label: "Quantity",
      value: deal.quantity === null ? null : String(Number(deal.quantity)),
    },
    { label: "Payment terms", value: deal.paymentTerms },
    { label: "Invoice sent", value: deal.invoiceSentAt ? formatMedium(deal.invoiceSentAt) : null },
    { label: "Invoice paid", value: deal.invoicePaidAt ? formatMedium(deal.invoicePaidAt) : null },
    { label: "CSAT", value: deal.csatScore === null ? null : `${deal.csatScore}/10` },
  ];

  const outcome: Row[] = [
    { label: "Lost reason", value: deal.lostReason },
    { label: "Detail", value: deal.lostReasonDetail },
  ];

  // Salesforce's own dates, which are not OneSpace's - firstSeenAt is when
  // the deal was created there, createdAt only when the import ran.
  const history: Row[] = [
    { label: "Created", value: deal.firstSeenAt ? formatMedium(deal.firstSeenAt) : null,
      note: deal.createdBy?.name ? `by ${deal.createdBy.name}` : undefined },
    {
      label: "Fiscal period",
      value: deal.fiscalYear ? `${deal.fiscalYear} Q${deal.fiscalQuarter ?? "?"}` : null,
    },
    {
      label: "Stage last changed",
      value: deal.lastStageChangeAt ? formatMedium(deal.lastStageChangeAt) : null,
    },
    {
      label: "Last activity",
      value: deal.lastActivityAt ? formatMedium(deal.lastActivityAt) : null,
    },
    {
      label: "Last edited in Salesforce",
      value: deal.lastModifiedAt ? formatMedium(deal.lastModifiedAt) : null,
    },
    { label: "Legacy id", value: deal.legacyId },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={deal.name}
        subtitle={
          <>
            <Link href={`/crm/${deal.client.id}`} className="underline">
              {deal.client.name}
            </Link>
            {deal.closeDate ? ` · closed ${formatMedium(deal.closeDate)}` : ""}
          </>
        }
      />

      <div className="card mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-3 p-5">
        <div>
          <p className="text-xs text-ink-500">Amount</p>
          <p className="text-3xl font-semibold tabular-nums text-ink-900">
            {money(deal.amount === null ? null : Number(deal.amount))}
          </p>
        </div>
        <span
          className={`chip ${
            deal.isWon
              ? "bg-brand-100 text-brand-700"
              : deal.isClosed
                ? "bg-ink-100 text-ink-600"
                : "bg-warn-50 text-warn-700"
          }`}
        >
          {STAGE_LABEL[deal.stage]}
        </span>
        {deal.project ? (
          <Link
            href={`/projects/${deal.project.id}`}
            className="ml-auto text-sm text-brand-600 underline"
          >
            {deal.project.name}
          </Link>
        ) : null}
      </div>

      <Group title="Who" rows={who} />

      {deal.lines.length > 0 ? (
        <section className="card mb-4 p-5">
          <h2 className="mb-3 text-sm font-medium text-ink-900">What was sold</h2>
          <ul className="divide-y divide-ink-100">
            {deal.lines.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline gap-2 py-2">
                <span className="text-sm text-ink-900">
                  {l.product?.name ?? l.productName ?? "Unnamed product"}
                </span>
                {l.product?.delivery ? (
                  <span className="chip bg-ink-100 text-ink-600">
                    {l.product.delivery}
                  </span>
                ) : null}
                {l.product?.sowUrl ? (
                  <a
                    href={l.product.sowUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-600 underline"
                  >
                    SOW
                  </a>
                ) : null}
                <span className="ml-auto shrink-0 text-sm tabular-nums text-ink-700">
                  {l.quantity && Number(l.quantity) !== 1
                    ? `${Number(l.quantity)} × `
                    : ""}
                  {money(l.totalPrice === null ? null : Number(l.totalPrice))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {deal.contactRoles.length > 0 ? (
        <section className="card mb-4 p-5">
          <h2 className="mb-3 text-sm font-medium text-ink-900">
            Who played what part
          </h2>
          <ul className="divide-y divide-ink-100">
            {deal.contactRoles.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-2 py-2">
                <span className="text-sm text-ink-900">
                  {person(r.contact) ?? "Someone no longer in the contacts"}
                </span>
                {r.role ? (
                  <span className="chip bg-ink-100 text-ink-600">{r.role}</span>
                ) : null}
                {r.isPrimary ? (
                  <span className="chip bg-brand-100 text-brand-700">Primary</span>
                ) : null}
                {r.contact?.email ? (
                  <a
                    href={`mailto:${r.contact.email}`}
                    className="ml-auto shrink-0 text-xs text-brand-600 underline"
                  >
                    {r.contact.email}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Group title="Delivery" rows={delivery} />
      <Group title="Money" rows={moneyRows} />
      {deal.isClosed && !deal.isWon ? <Group title="Why it was lost" rows={outcome} /> : null}
      <Group title="History" rows={history} />

      {[
        ["Scope", deal.customScopeDetail],
        ["Description", deal.description],
        ["Billing notes", deal.billingNotes],
        ["Future phases", deal.futurePhaseNotes],
      ]
        .filter(([, v]) => v)
        .map(([label, v]) => (
          <section key={label as string} className="card mb-4 p-5">
            <h2 className="mb-2 text-sm font-medium text-ink-900">{label}</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-700">
              {v as string}
            </p>
          </section>
        ))}

      {deal.sfdcId ? (
        <p className="text-xs text-ink-400">Salesforce id {deal.sfdcId}</p>
      ) : null}
    </div>
  );
}

type Row = { label: string; value: string | null; note?: string; href?: string };

/** Only the rows that have something in them. */
function Group({ title, rows }: { title: string; rows: Row[] }) {
  const filled = rows.filter((r) => r.value);
  if (filled.length === 0) return null;

  return (
    <section className="card mb-4 p-5">
      <h2 className="mb-3 text-sm font-medium text-ink-900">{title}</h2>
      <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {filled.map((r) => (
          <div key={r.label}>
            <dt className="text-xs text-ink-500">{r.label}</dt>
            <dd className="text-sm text-ink-900">
              {r.href ? (
                <Link href={r.href} className="underline">
                  {r.value}
                </Link>
              ) : (
                r.value
              )}
              {r.note ? (
                <span className="block text-xs text-ink-500">{r.note}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
