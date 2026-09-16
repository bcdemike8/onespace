import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
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

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  await requireUser();
  const { account } = await searchParams;

  const client = account
    ? await db.client.findUnique({
        where: { id: account },
        select: { id: true, name: true, partnerId: true, ownerId: true },
      })
    : null;

  const [accounts, partners, people, contacts, partnerContacts, partnerAccounts] =
    await Promise.all([
    accountOptions(),
    partnerOptions(),
    peopleOptions(),
    contactOptions(client?.id),
    partnerContactOptions(),
    partnerAccountOptions(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="New"
        title="New deal"
        subtitle={
          client
            ? `For ${client.name}. A name and an account are required; the rest can wait.`
            : "A name and an account are required. The rest can wait — the page shows what is still blank."
        }
      />
      <DealForm
        values={{
          clientId: client?.id ?? null,
          // Carried across from the account, because a deal for an Outreach
          // client is an Outreach deal until somebody says otherwise.
          partnerId: client?.partnerId ?? null,
          ownerId: client?.ownerId ?? null,
          stage: "QUALIFICATION",
          type: client?.partnerId ? "PARTNER" : "DIRECT",
        }}
        accounts={accounts}
        partners={partners}
        people={people}
        contacts={contacts}
        partnerContacts={partnerContacts}
        partnerAccounts={partnerAccounts}
        cancelHref={client ? `/crm/${client.id}` : "/crm/deals"}
      />
    </div>
  );
}
