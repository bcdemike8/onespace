import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import { STAGE_LABEL, money, stagePath } from "@/lib/crm/view";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * One deal, laid out the way Salesforce laid out an Opportunity.
 *
 * Same sections, same order, same two columns: Opportunity Information,
 * Opportunity Detail, Billing Notes, Project Notes, Other Information,
 * System Information - with the stage path across the top and the related
 * lists down the right. Nobody should have to learn where anything went.
 *
 * Empty fields are shown as "—" rather than hidden, which is a reversal of
 * what this page used to do. Hiding them made a tidier screen and a worse
 * one: the blanks on a deal are the unbilled invoice and the audit nobody
 * booked, and a field that disappears when unfilled can never be noticed as
 * missing. The account page settled this argument first; this follows it.
 *
 * What Salesforce could not do is the right-hand rail's last card: the
 * project this deal turned into, and the hours actually worked on it.
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
      primaryContact: {
        select: { id: true, firstName: true, lastName: true, email: true, title: true },
      },
      billingContact: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      partnerAe: {
        select: { id: true, firstName: true, lastName: true, email: true, title: true },
      },
      createdBy: { select: { name: true } },
      lastModifiedBy: { select: { name: true } },
      contactRoles: {
        orderBy: [{ isPrimary: "desc" }, { role: "asc" }],
        select: {
          id: true,
          role: true,
          isPrimary: true,
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true, title: true },
          },
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

  const hours = deal.project
    ? await db.timeEntry.aggregate({
        where: { projectId: deal.project.id },
        _sum: { minutes: true },
      })
    : null;

  const person = (p: { firstName: string | null; lastName: string } | null) =>
    p ? [p.firstName, p.lastName].filter(Boolean).join(" ") : null;

  const when = (d: Date | null) => (d ? formatMedium(d) : null);
  const amount = deal.amount === null ? null : Number(deal.amount);
  const path = stagePath(deal.stage);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={deal.name}
        subtitle={
          <>
            <Link href={`/crm/${deal.client.id}`} className="underline">
              {deal.client.name}
            </Link>
            {deal.closeDate
              ? ` · ${deal.isClosed ? "closed" : "closing"} ${formatMedium(deal.closeDate)}`
              : ""}
          </>
        }
      />

      <div className="card mb-4 p-5">
        <ol className="flex flex-wrap gap-1">
          {path.map((step) => (
            <li
              key={step.stage}
              className={`flex-1 rounded px-2 py-1.5 text-center text-[11px] whitespace-nowrap ${
                step.state === "current"
                  ? deal.stage === "CLOSED_LOST"
                    ? "bg-ink-700 font-medium text-white"
                    : "bg-brand-600 font-medium text-white"
                  : step.state === "done"
                    ? "bg-brand-100 text-brand-700"
                    : "bg-ink-50 text-ink-400"
              }`}
            >
              {/* Labelled throughout, where Salesforce showed a bare tick and
                  made you hover. Six identical ticks answer "is it done"
                  and not "done with what", which is the question. */}
              {step.state === "done" ? `✓ ${step.label}` : step.label}
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-ink-500">Amount</p>
            <p className="text-3xl font-semibold tabular-nums text-ink-900">
              {money(amount)}
            </p>
          </div>
          {/* Stage and close date only. Everything else this line could hold
              is repeated in full three inches below it. */}
          <Figure label="Stage" value={STAGE_LABEL[deal.stage]} />
          <Figure
            label={deal.isClosed ? "Closed" : "Expected close"}
            value={when(deal.closeDate) ?? "—"}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div>
          <Section title="Opportunity information">
            <Field
              label="Account name"
              value={deal.client.name}
              href={`/crm/${deal.client.id}`}
            />
            <Field label="Stage" value={STAGE_LABEL[deal.stage]} />
            <Field label="Opportunity name" value={deal.name} />
            <Field label="Amount" value={amount === null ? null : money(amount)} />
            <Field label="Type" value={deal.partner?.name ?? "Direct"} />
            <Field label="Close date" value={when(deal.closeDate)} />
            <Field
              label="Opportunity record type"
              value={deal.type === "PARTNER" ? "Partner" : "Direct"}
            />
            <Field
              label="Probability (%)"
              value={deal.probability === null ? null : `${deal.probability}%`}
            />
            <Field label="Opportunity owner" value={deal.owner?.name} />
            <Field label="Forecast category" value={deal.forecastCategory} />
            <Field label="Partner hold" value={deal.partnerHold ? "Yes" : null} />
            <Field label="Next step" value={deal.nextStep} />
            <Field label="SQL date" value={when(deal.sqlDate)} />
            <Field
              label="Deal length"
              value={deal.dealLength === null ? null : `${deal.dealLength} days`}
            />
            <Field label="SQL" value={deal.isSql ? "Yes" : null} />
            <Field label="Lost reason" value={deal.lostReason} />
            <Field
              label="Partner AE"
              value={person(deal.partnerAe)}
              note={deal.partnerAe?.title ?? deal.partnerAe?.email}
            />
            <Field label="Lost reason detail" value={deal.lostReasonDetail} />
            <Field
              label="CSAT score"
              value={deal.csatScore === null ? null : `${deal.csatScore}/10`}
            />
            <Field label="Business type" value={deal.businessType} />
            <Field label="Audit completed" value={deal.auditCompleted ? "Yes" : null} />
            <Field label="Audit completed date" value={when(deal.auditCompletedDate)} />
          </Section>

          <Section title="Opportunity detail">
            <Field label="Description" value={deal.description} wide />
          </Section>

          <Section title="Billing notes">
            <Field label="Billing notes" value={deal.billingNotes} wide />
            <Field label="Subcontract" value={deal.subcontract ? "Yes" : null} />
            <Field label="Payment terms" value={deal.paymentTerms} />
            <Field
              label="Billing contact"
              value={person(deal.billingContact)}
              href={
                deal.billingContact ? `/crm/contacts/${deal.billingContact.id}` : undefined
              }
            />
            <Field label="Invoice sent" value={when(deal.invoiceSentAt)} />
            <Field label="Email" value={deal.billingContact?.email} />
            <Field label="Invoice paid" value={when(deal.invoicePaidAt)} />
          </Section>

          <Section title="Project notes">
            <Field
              label="Primary contact"
              value={person(deal.primaryContact)}
              note={deal.primaryContact?.title ?? deal.primaryContact?.email}
              href={
                deal.primaryContact ? `/crm/contacts/${deal.primaryContact.id}` : undefined
              }
            />
            <Field label="Custom scope detail" value={deal.customScopeDetail} />
            <Field label="Lead consultant" value={deal.leadConsultant?.name} />
            <Field
              label="Performance Pulse opt-in"
              value={deal.performancePulse ? "Yes" : null}
            />
            <Field label="Secondary consultant" value={deal.secondaryConsultant?.name} />
            <Field label="3 month audit date" value={when(deal.threeMonthAuditDate)} />
            <Field label="Project start date" value={when(deal.projectStartDate)} />
            <Field label="Future phase notes" value={deal.futurePhaseNotes} />
            <Field
              label="Project completion date"
              value={when(deal.projectCompletionDate)}
            />
            <Field
              label="Project duration"
              value={
                deal.projectDuration === null ? null : `${deal.projectDuration} days`
              }
            />
          </Section>

          <Section title="Other information">
            {/* Three Salesforce lookups that have nothing to point at in
                OneSpace yet. Whatever the export carried is shown as it
                stood, rather than the row quietly disappearing. */}
            <Field label="Contract" value={deal.contractRef} />
            <Field label="Synced quote" value={deal.syncedQuoteRef} />
            <Field label="Lead source" value={deal.leadSource} />
            <Field label="Primary campaign source" value={deal.campaignSourceRef} />
          </Section>

          <Section title="System information">
            <Field
              label="Created by"
              value={deal.createdBy?.name}
              note={when(deal.firstSeenAt)}
            />
            <Field
              label="Last modified by"
              value={deal.lastModifiedBy?.name}
              note={when(deal.lastModifiedAt)}
            />
            <Field label="Stage last changed" value={when(deal.lastStageChangeAt)} />
            <Field label="Last activity" value={when(deal.lastActivityAt)} />
            <Field
              label="Fiscal period"
              value={
                deal.fiscalYear
                  ? `${deal.fiscalYear} Q${deal.fiscalQuarter ?? "?"}`
                  : null
              }
            />
            <Field label="Legacy id" value={deal.legacyId} />
            <Field
              label="Expected revenue"
              value={
                deal.expectedRevenue === null
                  ? null
                  : money(Number(deal.expectedRevenue))
              }
            />
            <Field label="Salesforce id" value={deal.sfdcId} />
          </Section>
        </div>

        <div className="flex flex-col gap-4">
          <Related title="Contact roles" count={deal.contactRoles.length}>
            {deal.contactRoles.map((r) => (
              <li key={r.id} className="py-2 text-sm">
                <div className="flex items-baseline gap-2">
                  {r.contact ? (
                    <Link
                      href={`/crm/contacts/${r.contact.id}`}
                      className="text-ink-900 underline"
                    >
                      {person(r.contact)}
                    </Link>
                  ) : (
                    <span className="text-ink-500">No longer in the contacts</span>
                  )}
                  {r.isPrimary ? (
                    <span className="chip bg-brand-100 text-brand-700">Primary</span>
                  ) : null}
                </div>
                <p className="text-xs text-ink-500">
                  {[r.role, r.contact?.title].filter(Boolean).join(" · ") || "No role"}
                </p>
              </li>
            ))}
          </Related>

          <Related title="Products" count={deal.lines.length}>
            {deal.lines.map((l) => (
              <li key={l.id} className="py-2 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="text-ink-900">
                    {l.product?.name ?? l.productName ?? "Unnamed product"}
                  </span>
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
                </div>
                <p className="text-xs text-ink-500 tabular-nums">
                  {l.quantity === null ? "" : `Qty ${Number(l.quantity)} · `}
                  {l.unitPrice === null ? "" : `${money(Number(l.unitPrice))} each · `}
                  {money(l.totalPrice === null ? null : Number(l.totalPrice))}
                </p>
              </li>
            ))}
          </Related>

          <Related title="Project" count={deal.project ? 1 : 0}>
            {deal.project ? (
              <li className="py-2 text-sm">
                <Link
                  href={`/projects/${deal.project.id}`}
                  className="text-ink-900 underline"
                >
                  {deal.project.name}
                </Link>
                <p className="text-xs text-ink-500">
                  {deal.project.status}
                  {hours?._sum.minutes
                    ? ` · ${Math.round(hours._sum.minutes / 60).toLocaleString()} hours logged`
                    : ""}
                </p>
              </li>
            ) : null}
          </Related>
        </div>
      </div>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-sm font-medium text-ink-900">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card mb-4 p-5">
      <h2 className="mb-3 border-b border-ink-100 pb-2 text-sm font-medium text-ink-900">
        {title}
      </h2>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

/**
 * One field, shown even when it is empty - the same bargain the account page
 * makes, for the same reason.
 *
 * Salesforce read down two columns rather than across, so the order here is
 * the order of the fields as they sat on that page: left, right, left,
 * right. Change the grid and the pairs come apart.
 */
function Field({
  label,
  value,
  note,
  href,
  wide,
}: {
  label: string;
  value?: string | null;
  note?: string | null;
  href?: string;
  wide?: boolean;
}) {
  const shown = value && value.trim() !== "" ? value : null;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd
        className={`text-sm whitespace-pre-line ${shown ? "text-ink-900" : "text-ink-300"}`}
      >
        {shown ? (
          href ? (
            <Link href={href} className="underline">
              {shown}
            </Link>
          ) : (
            shown
          )
        ) : (
          "—"
        )}
        {shown && note ? (
          <span className="block text-xs text-ink-500">{note}</span>
        ) : null}
      </dd>
    </div>
  );
}

function Related({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4">
      <h2 className="mb-1 text-sm font-medium text-ink-900">
        {title} <span className="text-ink-400">({count})</span>
      </h2>
      {count === 0 ? (
        <p className="text-sm text-ink-400">None.</p>
      ) : (
        <ul className="divide-y divide-ink-100">{children}</ul>
      )}
    </section>
  );
}
