import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountOptions, contactOptions, peopleOptions } from "@/lib/crm/options";
import { ContactForm } from "@/components/crm/ContactForm";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const contact = await db.contact.findUnique({ where: { id } });
  if (!contact) notFound();

  const [accounts, people, colleagues] = await Promise.all([
    accountOptions(),
    peopleOptions(),
    contactOptions(contact.clientId, [contact.reportsToId]),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Edit contact"
        title={[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
      />
      <ContactForm
        values={contact}
        accounts={accounts}
        people={people}
        // Never themselves: a contact reporting to themselves is a loop the
        // org chart walks forever.
        colleagues={colleagues.filter((c) => c.value !== id)}
        cancelHref={`/crm/contacts/${id}`}
      />
    </div>
  );
}
