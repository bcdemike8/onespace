import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import { STAGE_LABEL, money } from "@/lib/crm/view";
import { Columns, Field, Figure } from "@/components/crm/Record";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * One line on one deal - Salesforce's Opportunity Product.
 *
 * Its own page because it is its own record: the same product sold twice at
 * different prices is two of these, and the difference between them is the
 * whole question. The deal page lists them; this is what opens.
 *
 * Sales Price sits opposite List Price deliberately, as it did in Salesforce.
 * Read together they are the discount, and the discount is the one number
 * here that cannot be reconstructed from anything else later.
 */
export default async function LinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const line = await db.dealProduct.findUnique({
    where: { id },
    include: {
      deal: {
        select: {
          id: true,
          name: true,
          stage: true,
          client: { select: { id: true, name: true } },
        },
      },
      product: {
        select: { id: true, name: true, code: true, delivery: true, sowUrl: true },
      },
      createdBy: { select: { name: true } },
      lastModifiedBy: { select: { name: true } },
    },
  });

  if (!line) notFound();

  const when = (d: Date | null) => (d ? formatMedium(d) : null);
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

  const quantity = num(line.quantity);
  const unitPrice = num(line.unitPrice);
  const totalPrice = num(line.totalPrice);
  const listPrice = num(line.listPrice);

  const productName = line.product?.name ?? line.productName ?? "Unnamed product";
  // Salesforce titled the record with the opportunity and the product run
  // together, which is ungainly and is also how anyone searching for it will
  // recognise it.
  const title = `${line.deal.name} ${productName}`;

  // The catalogue price against what was charged. Shown only when both are
  // known and they differ - "0% discount" on every line is noise, and a
  // percentage computed from a missing list price is a lie.
  const discount =
    listPrice !== null && unitPrice !== null && listPrice > 0 && listPrice !== unitPrice
      ? Math.round(((listPrice - unitPrice) / listPrice) * 100)
      : null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={title}
        eyebrow="Opportunity product"
        subtitle={
          <>
            <Link href={`/crm/deals/${line.deal.id}`} className="underline">
              {line.deal.name}
            </Link>
            {" · "}
            <Link href={`/crm/${line.deal.client.id}`} className="underline">
              {line.deal.client.name}
            </Link>
            {` · ${STAGE_LABEL[line.deal.stage]}`}
          </>
        }
      />

      <div className="card mb-4 flex flex-wrap items-baseline gap-x-8 gap-y-3 p-5">
        <div>
          <p className="text-xs text-ink-500">Product</p>
          <p className="text-lg font-medium text-ink-900">{productName}</p>
        </div>
        <Figure label="Quantity" value={quantity === null ? "—" : String(quantity)} />
        <Figure label="Sales price" value={money(unitPrice)} />
        <Figure
          label="Product code"
          value={line.productCode ?? line.product?.code ?? "—"}
        />
        {discount !== null ? (
          <span
            className={`chip ${
              discount > 0 ? "bg-warn-50 text-warn-700" : "bg-brand-100 text-brand-700"
            }`}
          >
            {discount > 0 ? `${discount}% off list` : `${-discount}% over list`}
          </span>
        ) : null}
        {line.product?.sowUrl ? (
          <a
            href={line.product.sowUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto self-center text-sm text-brand-600 underline"
          >
            Statement of work
          </a>
        ) : null}
      </div>

      <Columns
        title="Details"
        left={
          <>
            <Field
              label="Opportunity"
              value={line.deal.name}
              href={`/crm/deals/${line.deal.id}`}
            />
            <Field
              label="Product"
              value={productName}
              note={line.product?.delivery}
              // Products have no page of their own yet. Rather than link to
              // a 404, the name stands as text.
            />
            <Field
              label="Sales price"
              value={unitPrice === null ? null : money(unitPrice)}
            />
            <Field label="Quantity" value={quantity === null ? null : String(quantity)} />
            <Field
              label="Created by"
              value={line.createdBy?.name}
              note={when(line.firstSeenAt)}
            />
            <Field label="Line description" value={line.description} />
          </>
        }
        right={
          <>
            <Field label="Date" value={when(line.serviceDate)} />
            <Field
              label="Product code"
              value={line.productCode ?? line.product?.code}
            />
            <Field
              label="List price"
              value={listPrice === null ? null : money(listPrice)}
            />
            <Field
              label="Total price"
              value={totalPrice === null ? null : money(totalPrice)}
            />
            <Field
              label="Last modified by"
              value={line.lastModifiedBy?.name}
              note={when(line.lastModifiedAt)}
            />
          </>
        }
      />

      {line.sfdcId ? (
        <p className="text-xs text-ink-400">Salesforce id {line.sfdcId}</p>
      ) : null}
    </div>
  );
}
