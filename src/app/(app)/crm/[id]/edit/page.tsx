import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  accountOptions,
  contactOptions,
  partnerOptions,
  peopleOptions,
} from "@/lib/crm/options";
import { AccountForm } from "@/components/crm/AccountForm";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const client = await db.client.findUnique({ where: { id } });
  if (!client) notFound();

  const [accounts, partners, people, contacts] = await Promise.all([
    // Not itself: an account that is its own parent makes an endless page.
    accountOptions(id),
    partnerOptions(),
    peopleOptions(),
    contactOptions(id, [client.primaryContactId]),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Edit account" title={client.name} />
      <AccountForm
        values={{
          ...client,
          annualRevenue:
            client.annualRevenue === null ? null : String(client.annualRevenue),
        }}
        accounts={accounts}
        partners={partners}
        people={people}
        contacts={contacts}
        cancelHref={`/crm/${id}`}
      />
    </div>
  );
}
