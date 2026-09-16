import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import { ACCOUNT_LABEL, STAGE_LABEL, money } from "@/lib/crm/view";
import { addressLines, employeeRange, revenueRange } from "@/lib/crm/account";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * One company, laid out the way Salesforce laid it out.
 *
 * The sections and their order are deliberately the ones RevOptics already
 * reads - Account Information, Performance Pulse, Additional, Address,
 * System - because the point of a replacement is that nobody has to learn
 * where anything went.
 *
 * Empty fields are shown rather than hidden, which is the opposite of the
 * deal page. On a deal, a blank field is noise; on an account it is a
 * prompt - the gaps are the work, and hiding them hides what needs filling
 * in. The two pages differ on purpose.
 *
 * What Salesforce could not do is the middle column: the deals, the projects
 * those deals became, and the hours actually worked, all on one page.
 */
export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const client = await db.client.findUnique({
    where: { id },
    include: {
      partner: { select: { name: true } },
      owner: { select: { name: true } },
      createdBy: { select: { name: true } },
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      primaryContact: {
        select: { id: true, firstName: true, lastName: true, email: true, title: true },
      },
      domains: { select: { domain: true }, orderBy: { domain: "asc" } },
      projects: {
        select: { id: true, name: true, status: true },
        orderBy: { name: "asc" },
      },
      deals: {
        orderBy: [{ closeDate: "desc" }],
        select: {
          id: true,
          name: true,
          stage: true,
          amount: true,
          closeDate: true,
          isWon: true,
          isClosed: true,
          leadConsultant: { select: { name: true } },
        },
      },
      contacts: {
        orderBy: [{ noLongerHere: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          title: true,
          noLongerHere: true,
        },
      },
    },
  });

  if (!client) notFound();

  const minutes = await db.timeEntry.aggregate({
    where: { project: { clientId: client.id } },
    _sum: { minutes: true },
  });
  const hours = Math.round((minutes._sum.minutes ?? 0) / 60);

  const won = client.deals.filter((d) => d.isWon);
  const revenue = won.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
  const open = client.deals.filter((d) => !d.isClosed);

  const contactName = (p: { firstName: string | null; lastName: string } | null) =>
    p ? [p.firstName, p.lastName].filter(Boolean).join(" ") : null;

  const shipping = addressLines(client);
  const billing = addressLines({
    street: client.billingStreet,
    city: client.billingCity,
    state: client.billingState,
    postalCode: client.billingPostalCode,
    country: client.billingCountry,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={client.name}
        subtitle={`${ACCOUNT_LABEL[client.accountType]}${
          client.partner ? ` · via ${client.partner.name}` : ""
        }`}
      />

      {client.escalation ? (
        <p className="mb-4 rounded-lg border border-warn-500/30 bg-warn-50 px-4 py-2.5 text-sm text-warn-700">
          Flagged as a bad client experience. Worth reading the history before
          the next conversation.
        </p>
      ) : null}

      <div className="card mb-4 flex flex-wrap gap-x-8 gap-y-3 p-5 text-sm">
        <Figure label="Revenue won" value={money(revenue)} note={`${won.length} deals`} />
        <Figure label="Hours logged" value={hours.toLocaleString()} />
        <Figure label="Open deals" value={String(open.length)} />
        <Figure label="Contacts" value={String(client.contacts.length)} />
        {client.website ? (
          <a
            href={
              client.website.startsWith("http")
                ? client.website
                : `https://${client.website}`
            }
            target="_blank"
            rel="noreferrer"
            className="ml-auto self-center text-brand-600 underline"
          >
            {client.website}
          </a>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div>
          <Section title="Account information">
            <Field label="Account name" value={client.name} />
            <Field label="Account owner" value={client.owner?.name} />
            <Field label="Legal name" value={client.legalName} />
            <Field
              label="Primary contact"
              value={contactName(client.primaryContact)}
              note={client.primaryContact?.title}
            />
            <Field
              label="Escalation / bad client experience"
              value={client.escalation ? "Yes" : null}
            />
            <Field label="Apollo implementation stage" value={client.apolloStage} />
            <Field label="Implementation owner" value={client.implementationOwner} />
            <Field
              label="Stage last updated"
              value={
                client.stageLastUpdatedAt ? formatMedium(client.stageLastUpdatedAt) : null
              }
            />
            <Field
              label="Parent account"
              value={client.parent?.name}
              href={client.parent ? `/crm/${client.parent.id}` : undefined}
            />
            <Field label="Type" value={client.partner?.name} />
            <Field label="Industry" value={client.industry} />
            <Field label="Account record type" value={ACCOUNT_LABEL[client.accountType]} />
            <Field label="Number of won opportunities" value={String(won.length)} />
          </Section>

          <Section title="Performance Pulse info">
            <Field label="Technology used" value={client.technologyUsed.join(", ")} />
            <Field
              label="Employee size range"
              value={employeeRange(client.employees)}
              note={client.employees ? `${client.employees.toLocaleString()} staff` : undefined}
            />
            <Field label="Sales roles present" value={client.salesRoles.join(", ")} />
            <Field
              label="Revenue range"
              value={revenueRange(
                client.annualRevenue === null ? null : Number(client.annualRevenue),
              )}
            />
            <Field label="XDR size" value={client.xdrSize?.toLocaleString()} />
            <Field label="Funders" value={client.funders.join(", ")} />
            <Field label="Team size" value={client.teamSize?.toLocaleString()} />
          </Section>

          <Section title="Additional information">
            <Field label="Description" value={client.description} wide />
            <Field label="Website" value={client.website} />
            <Field label="LinkedIn" value={client.linkedinUrl} />
            <Field label="Phone" value={client.phone} />
          </Section>

          <Section title="Address information">
            <Field label="Billing address" value={billing.join("\n") || null} />
            <Field label="Shipping address" value={shipping.join("\n") || null} />
          </Section>

          <Section title="System information">
            <Field
              label="Created"
              value={client.firstSeenAt ? formatMedium(client.firstSeenAt) : null}
              note={client.createdBy?.name ? `by ${client.createdBy.name}` : undefined}
            />
            <Field
              label="Last modified in Salesforce"
              value={client.lastModifiedAt ? formatMedium(client.lastModifiedAt) : null}
            />
            <Field label="Salesforce id" value={client.sfdcId} />
            <Field
              label="Email domains"
              value={client.domains.map((d) => d.domain).join(", ")}
            />
          </Section>
        </div>

        {/* ------------------------------------------------- the related lists */}
        <aside className="space-y-4">
          <Related title="Deals" count={client.deals.length}>
            {client.deals.slice(0, 12).map((d) => (
              <li key={d.id} className="py-2">
                <Link
                  href={`/crm/deals/${d.id}`}
                  className="text-sm text-ink-900 underline decoration-ink-200 hover:decoration-ink-500"
                >
                  {d.name}
                </Link>
                <p className="mt-0.5 flex flex-wrap items-baseline gap-2 text-xs text-ink-500">
                  <span
                    className={
                      d.isWon
                        ? "text-brand-700"
                        : d.isClosed
                          ? "text-ink-500"
                          : "text-warn-700"
                    }
                  >
                    {STAGE_LABEL[d.stage]}
                  </span>
                  <span className="tabular-nums">
                    {money(d.amount === null ? null : Number(d.amount))}
                  </span>
                  {d.closeDate ? <span>{formatMedium(d.closeDate)}</span> : null}
                </p>
              </li>
            ))}
          </Related>

          <Related title="Contacts" count={client.contacts.length}>
            {client.contacts.slice(0, 15).map((p) => (
              <li key={p.id} className="py-2">
                <span
                  className={`text-sm ${
                    p.noLongerHere ? "text-ink-400 line-through" : "text-ink-900"
                  }`}
                >
                  {contactName(p)}
                </span>
                <p className="text-xs text-ink-500">
                  {p.title ?? ""}
                  {p.email ? (
                    <>
                      {p.title ? " · " : ""}
                      <a href={`mailto:${p.email}`} className="underline">
                        {p.email}
                      </a>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </Related>

          {client.projects.length > 0 ? (
            <Related title="Projects" count={client.projects.length}>
              {client.projects.map((p) => (
                <li key={p.id} className="py-2">
                  <Link href={`/projects/${p.id}`} className="text-sm text-ink-900 underline decoration-ink-200">
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink-500">{p.status}</p>
                </li>
              ))}
            </Related>
          ) : null}

          {client.children.length > 0 ? (
            <Related title="Child accounts" count={client.children.length}>
              {client.children.map((c) => (
                <li key={c.id} className="py-2">
                  <Link href={`/crm/${c.id}`} className="text-sm text-ink-900 underline decoration-ink-200">
                    {c.name}
                  </Link>
                </li>
              ))}
            </Related>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Figure({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-lg font-medium tabular-nums text-ink-900">{value}</p>
      {note ? <p className="text-xs text-ink-400">{note}</p> : null}
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
 * One field, shown even when it is empty.
 *
 * The blank is the point: an account page is a list of what is known and
 * what isn't, and a field that disappears when unfilled can never be
 * noticed as missing.
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
        <p className="text-sm text-ink-400">None yet.</p>
      ) : (
        <ul className="divide-y divide-ink-100">{children}</ul>
      )}
    </section>
  );
}
