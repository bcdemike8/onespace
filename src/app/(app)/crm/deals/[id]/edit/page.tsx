import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateValue } from "@/lib/crm/form";
import {
  accountOptions,
  contactOptions,
  partnerAccountOptions,
  partnerContactOptions,
  partnerOptions,
  peopleOptions,
} from "@/lib/crm/options";
import { DealForm } from "@/components/crm/DealForm";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const deal = await db.deal.findUnique({ where: { id } });
  if (!deal) notFound();

  const [accounts, partners, people, contacts, partnerContacts, partnerAccounts] =
    await Promise.all([
    accountOptions(),
    partnerOptions(),
    peopleOptions(),
    // Whoever is already set stays offered, even if they work somewhere else.
    contactOptions(deal.clientId, [deal.primaryContactId, deal.billingContactId]),
    partnerContactOptions([deal.partnerAeId]),
    partnerAccountOptions(),
  ]);

  const money = (v: unknown) => (v === null || v === undefined ? null : String(v));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Edit deal" title={deal.name} />
      <DealForm
        values={{
          ...deal,
          amount: money(deal.amount),
          closeDate: dateValue(deal.closeDate),
          sqlDate: dateValue(deal.sqlDate),
          auditCompletedDate: dateValue(deal.auditCompletedDate),
          threeMonthAuditDate: dateValue(deal.threeMonthAuditDate),
          projectStartDate: dateValue(deal.projectStartDate),
          projectCompletionDate: dateValue(deal.projectCompletionDate),
          invoiceSentAt: dateValue(deal.invoiceSentAt),
          invoicePaidAt: dateValue(deal.invoicePaidAt),
        }}
        accounts={accounts}
        partners={partners}
        people={people}
        contacts={contacts}
        partnerContacts={partnerContacts}
        partnerAccounts={partnerAccounts}
        cancelHref={`/crm/deals/${id}`}
      />
    </div>
  );
}
