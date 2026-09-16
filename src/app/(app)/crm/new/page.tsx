import { requireUser } from "@/lib/auth";
import { accountOptions, partnerOptions, peopleOptions } from "@/lib/crm/options";
import { AccountForm } from "@/components/crm/AccountForm";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewAccountPage() {
  await requireUser();
  const [accounts, partners, people] = await Promise.all([
    accountOptions(),
    partnerOptions(),
    peopleOptions(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="New"
        title="New account"
        subtitle="Only the name is required. Everything else can be filled in later, and the page will show you what is still blank."
      />
      <AccountForm
        values={{ accountType: "PROSPECT" }}
        accounts={accounts}
        partners={partners}
        people={people}
        contacts={[]}
        cancelHref="/crm"
      />
    </div>
  );
}
