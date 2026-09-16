import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { productOptions } from "@/lib/crm/options";
import { LineForm } from "@/components/crm/LineForm";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewLinePage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  await requireUser();
  const { deal: dealId } = await searchParams;

  const deal = dealId
    ? await db.deal.findUnique({ where: { id: dealId }, select: { id: true, name: true } })
    : null;
  // A line with no deal has nowhere to live, so there is nothing useful to
  // show rather than a form that cannot be saved.
  if (!deal) notFound();

  const products = await productOptions();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="New product" title={deal.name} subtitle="Add what was sold." />
      <LineForm
        values={{ dealId: deal.id, quantity: "1" }}
        products={products}
        cancelHref={`/crm/deals/${deal.id}`}
      />
    </div>
  );
}
