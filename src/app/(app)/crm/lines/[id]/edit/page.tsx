import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateValue } from "@/lib/crm/form";
import { productOptions } from "@/lib/crm/options";
import { LineForm } from "@/components/crm/LineForm";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditLinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const line = await db.dealProduct.findUnique({
    where: { id },
    include: { deal: { select: { id: true, name: true } } },
  });
  if (!line) notFound();

  const products = await productOptions();
  const num = (v: unknown) => (v === null || v === undefined ? null : String(v));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Edit product"
        title={line.productName ?? line.deal.name}
        subtitle={line.deal.name}
      />
      <LineForm
        values={{
          ...line,
          dealId: line.dealId,
          quantity: num(line.quantity),
          unitPrice: num(line.unitPrice),
          totalPrice: num(line.totalPrice),
          listPrice: num(line.listPrice),
          serviceDate: dateValue(line.serviceDate),
        }}
        products={products}
        cancelHref={`/crm/lines/${id}`}
      />
    </div>
  );
}
