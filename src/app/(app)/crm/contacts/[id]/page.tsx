import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import { ACCOUNT_RECORD_TYPE, STAGE_LABEL, money } from "@/lib/crm/view";
import { addressLines } from "@/lib/crm/account";
import { Columns, Field, Related } from "@/components/crm/Record";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * One person, laid out the way Salesforce laid out a Contact.
 *
 * Contact Information, Additional Information, Address Information,
 * Description Information, System Information - in that order, with the
 * opportunities they touched down the right.
 *
 * The two columns are real columns, not a grid that alternates. Salesforce
 * fills down the left and then down the right, and this page's left column
 * has nine fields against the right's three; an alternating grid would put
 * Title beside Contact Owner and interleave the rest into nonsense. It is
 * worth the extra markup to have the page read where it read before.
 *
 * Empty fields show a dash, as on the account and deal pages. On a contact
 * the blanks are the missing mobile number and the unrecorded manager -
 * the things somebody would fill in if they could see they were missing.
 */
export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const contact = await db.contact.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          accountType: true,
          partner: { select: { name: true } },
        },
      },
      owner: { select: { name: true } },
      createdBy: { select: { name: true } },
      lastModifiedBy: { select: { name: true } },
      reportsTo: { select: { id: true, firstName: true, lastName: true, title: true } },
      reports: {
        select: { id: true, firstName: true, lastName: true, title: true },
        orderBy: { lastName: "asc" },
      },
      dealRoles: {
        select: {
          id: true,
          role: true,
          isPrimary: true,
          deal: {
            select: {
              id: true,
              name: true,
              stage: true,
              amount: true,
              closeDate: true,
            },
          },
        },
      },
      primaryForClient: { select: { id: true } },
    },
  });

  if (!contact) notFound();

  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const person = (p: { firstName: string | null; lastName: string } | null) =>
    p ? [p.firstName, p.lastName].filter(Boolean).join(" ") : null;
  const when = (d: Date | null) => (d ? formatMedium(d) : null);

  // Salesforce listed a contact's opportunities from the contact roles. The
  // other three ways a deal can point at a person - primary, billing, partner
  // AE - are not roles, and a deal that has one but no role row would be
  // missing from that list. Both are gathered, and deduplicated by deal.
  const namedOn = await db.deal.findMany({
    where: {
      OR: [
        { primaryContactId: id },
        { billingContactId: id },
        { partnerAeId: id },
      ],
    },
    select: {
      id: true,
      name: true,
      stage: true,
      amount: true,
      closeDate: true,
      primaryContactId: true,
      billingContactId: true,
      partnerAeId: true,
    },
  });

  type Involvement = {
    id: string;
    name: string;
    stage: keyof typeof STAGE_LABEL;
    amount: number | null;
    closeDate: Date | null;
    how: string[];
  };

  const involvement = new Map<string, Involvement>();
  const note = (
    deal: { id: string; name: string; stage: keyof typeof STAGE_LABEL; amount: unknown; closeDate: Date | null },
    how: string,
  ) => {
    const existing = involvement.get(deal.id);
    if (existing) {
      if (!existing.how.includes(how)) existing.how.push(how);
      return;
    }
    involvement.set(deal.id, {
      id: deal.id,
      name: deal.name,
      stage: deal.stage,
      amount: deal.amount === null ? null : Number(deal.amount),
      closeDate: deal.closeDate,
      how: [how],
    });
  };

  for (const r of contact.dealRoles) {
    if (r.deal) note(r.deal, r.isPrimary ? `${r.role ?? "Contact"} (primary)` : (r.role ?? "Contact"));
  }
  for (const d of namedOn) {
    if (d.primaryContactId === id) note(d, "Primary contact");
    if (d.billingContactId === id) note(d, "Billing contact");
    if (d.partnerAeId === id) note(d, "Partner AE");
  }

  const deals = [...involvement.values()].sort(
    (a, b) => (b.closeDate?.getTime() ?? 0) - (a.closeDate?.getTime() ?? 0),
  );

  const mailing = addressLines({
    street: contact.street,
    city: contact.city,
    state: contact.state,
    postalCode: contact.postalCode,
    country: contact.country,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={name}
        subtitle={
          <>
            {contact.title ? `${contact.title} · ` : ""}
            {contact.client ? (
              <Link href={`/crm/${contact.client.id}`} className="underline">
                {contact.client.name}
              </Link>
            ) : (
              "No company"
            )}
          </>
        }
      />

      {contact.noLongerHere || contact.optedOutOfEmail ? (
        <p className="mb-4 rounded-lg border border-warn-500/30 bg-warn-50 px-4 py-2.5 text-sm text-warn-700">
          {contact.noLongerHere
            ? "No longer with the company. Don't email them."
            : "Asked not to be emailed. The obligation outlived Salesforce."}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div>
          <Columns
            title="Contact information"
            left={
              <>
                <Field
                  label="Account name"
                  value={contact.client?.name}
                  href={contact.client ? `/crm/${contact.client.id}` : undefined}
                />
                <Field label="Contact owner" value={contact.owner?.name} />
                <Field label="Name" value={name} />
                {/* Both read off the account, as they did in Salesforce -
                    they are the account's answers, shown here so nobody has
                    to open another tab to find out who this person works for. */}
                <Field label="Account type" value={contact.client?.partner?.name} />
                <Field
                  label="Account record type"
                  value={
                    contact.client ? ACCOUNT_RECORD_TYPE[contact.client.accountType] : null
                  }
                />
                <Field label="LinkedIn URL" value={contact.linkedinUrl} />
                <Field label="Person notes" value={contact.notes} />
                <Field
                  label="No longer with company"
                  value={contact.noLongerHere ? "Yes" : null}
                />
                <Field label="Referral lead source" value={contact.referralLeadSource} />
              </>
            }
            right={
              <>
                <Field label="Title" value={contact.title} />
                <Field
                  label="Email"
                  value={contact.email}
                  mailto={contact.email ?? undefined}
                />
                <Field label="Phone" value={contact.phone} tel={contact.phone ?? undefined} />
              </>
            }
          />

          <Columns
            title="Additional information"
            left={
              <>
                <Field label="Mobile" value={contact.mobile} tel={contact.mobile ?? undefined} />
                <Field label="Fax" value={contact.fax} />
                {/* Not on the Salesforce layout, which showed only the
                    referral source. Both exist and answer different
                    questions, so the one that was hidden is shown here
                    rather than dropped on the floor. */}
                <Field label="Lead source" value={contact.leadSource} />
              </>
            }
            right={
              <>
                <Field
                  label="Reports to"
                  value={person(contact.reportsTo)}
                  note={contact.reportsTo?.title}
                  href={
                    contact.reportsTo ? `/crm/contacts/${contact.reportsTo.id}` : undefined
                  }
                />
                <Field label="Department" value={contact.department} />
              </>
            }
          />

          <Columns
            title="Address information"
            left={
              <Field
                label="Mailing address"
                value={mailing.length ? mailing.join("\n") : null}
              />
            }
            right={null}
          />

          <Columns
            title="Description information"
            left={<Field label="Description" value={contact.description} />}
            right={null}
          />

          <Columns
            title="System information"
            left={
              <Field
                label="Created by"
                value={contact.createdBy?.name}
                note={when(contact.firstSeenAt)}
              />
            }
            right={
              <Field
                label="Last modified by"
                value={contact.lastModifiedBy?.name}
                note={when(contact.lastModifiedAt)}
              />
            }
          />
        </div>

        <div className="flex flex-col gap-4">
          <Related title="Opportunities" count={deals.length}>
            {deals.map((d) => (
              <li key={d.id} className="py-2 text-sm">
                <Link href={`/crm/deals/${d.id}`} className="text-ink-900 underline">
                  {d.name}
                </Link>
                <p className="text-xs text-ink-500 tabular-nums">
                  {STAGE_LABEL[d.stage]} · {money(d.amount)}
                  {d.closeDate ? ` · ${formatMedium(d.closeDate)}` : ""}
                </p>
                <p className="text-xs text-ink-400">{d.how.join(" · ")}</p>
              </li>
            ))}
          </Related>

          {/* Two things Salesforce could not show on this page: everyone who
              reports to this person, and whether they are the account's
              primary contact. Both are in the data and neither had a home. */}
          <Related title="Reports" count={contact.reports.length}>
            {contact.reports.map((r) => (
              <li key={r.id} className="py-2 text-sm">
                <Link href={`/crm/contacts/${r.id}`} className="text-ink-900 underline">
                  {person(r)}
                </Link>
                {r.title ? <p className="text-xs text-ink-500">{r.title}</p> : null}
              </li>
            ))}
          </Related>

          {contact.primaryForClient ? (
            <section className="card p-4 text-sm text-ink-700">
              Primary contact for{" "}
              <Link href={`/crm/${contact.primaryForClient.id}`} className="underline">
                {contact.client?.name ?? "this account"}
              </Link>
              .
            </section>
          ) : null}
        </div>
      </div>

      {contact.sfdcId ? (
        <p className="mt-4 text-xs text-ink-400">Salesforce id {contact.sfdcId}</p>
      ) : null}
    </div>
  );
}
