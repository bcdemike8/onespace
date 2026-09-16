import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountOptions, contactOptions, peopleOptions } from "@/lib/crm/options";
import { ContactForm } from "@/components/crm/ContactForm";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * ?account=<id> arrives from an account page's "New contact", so the company
 * is already filled in and the Reports To picker already knows who else is
 * there. Typing the company again is the sort of small tax that stops people
 * recording contacts at all.
 */
export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  await requireUser();
  const { account } = await searchParams;

  const client = account
    ? await db.client.findUnique({ where: { id: account }, select: { id: true, name: true } })
    : null;

  const [accounts, people, colleagues] = await Promise.all([
    accountOptions(),
    peopleOptions(),
    contactOptions(client?.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="New"
        title="New contact"
        subtitle={
          client
            ? `At ${client.name}. Only a surname is required.`
            : "Only a surname is required — Salesforce insisted on one too, and a person with no surname is nobody anyone can look up."
        }
      />
      <ContactForm
        values={{ clientId: client?.id ?? null }}
        accounts={accounts}
        people={people}
        colleagues={colleagues}
        cancelHref={client ? `/crm/${client.id}` : "/crm/contacts"}
      />
    </div>
  );
}
