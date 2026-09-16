// Not server-only: the dashboard and both report pages import it, and all
// three are server components. It reaches for @/lib/db, which check:client
// already refuses to let a client component near.
import { db } from "@/lib/db";
import { dealType, fiscalPeriodOf, type ReportDeal } from "@/lib/crm/report";
import type { ReportRow } from "@/lib/crm/reports";

/**
 * One query behind the dashboard and the reports it links to.
 *
 * The point is that they cannot disagree. A dashboard whose chart says $712k
 * and whose "View report" says $698k is worse than having neither, and the
 * usual cause is two queries written a week apart with slightly different
 * ideas about what "closed" means.
 */

export interface Filters {
  from: Date;
  to: Date;
  /** Empty means every type. */
  types: string[];
}

const usDate = (d: Date | null): string =>
  d ? `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}` : "";

const monthLabel = (d: Date): string =>
  `${d.getUTCMonth() + 1}/1/${d.getUTCFullYear()}`;

/** Days from created to closed, which is what Salesforce calls Age. */
function age(created: Date | null, closed: Date | null): string {
  if (!created || !closed) return "";
  return String(Math.max(0, Math.round((closed.getTime() - created.getTime()) / 86_400_000)));
}

export interface LoadedDeals {
  /** For the charts. */
  deals: ReportDeal[];
  /** For the report tables, one per closed-won deal in range. */
  rows: ReportRow[];
  /** Every type present across all deals, so a filter can list them all. */
  allTypes: string[];
}

export async function loadReportDeals(filters: Filters): Promise<LoadedDeals> {
  const all = await db.deal.findMany({
    where: { isWon: true },
    select: {
      id: true,
      name: true,
      amount: true,
      closeDate: true,
      firstSeenAt: true,
      createdAt: true,
      isWon: true,
      isClosed: true,
      businessType: true,
      leadSource: true,
      nextStep: true,
      probability: true,
      stage: true,
      subcontract: true,
      projectCompletionDate: true,
      partner: { select: { name: true } },
      client: { select: { name: true } },
      owner: { select: { name: true } },
      billingContact: { select: { firstName: true, lastName: true } },
      lines: {
        orderBy: { createdAt: "asc" },
        select: { productName: true, product: { select: { name: true } } },
      },
    },
  });

  const asReportDeal = (d: (typeof all)[number]): ReportDeal => ({
    id: d.id,
    amount: d.amount === null ? null : Number(d.amount),
    closeDate: d.closeDate,
    isWon: d.isWon,
    isClosed: d.isClosed,
    platform: d.partner?.name ?? null,
    businessType: d.businessType,
    clientName: d.client.name,
    ownerName: d.owner?.name ?? null,
  });

  const everyType = [...new Set(all.map((d) => dealType(asReportDeal(d))))].sort();

  const inRange = all.filter((d) => {
    if (!d.closeDate || d.closeDate < filters.from || d.closeDate > filters.to) {
      return false;
    }
    if (filters.types.length === 0) return true;
    return filters.types.includes(dealType(asReportDeal(d)));
  });

  const deals = inRange.map(asReportDeal);

  const rows: ReportRow[] = inRange.map((d) => {
    const report = asReportDeal(d);
    // Salesforce's own Created Date, not OneSpace's - firstSeenAt is when the
    // deal was made there, createdAt only when the import ran.
    const created = d.firstSeenAt ?? null;

    return {
      id: d.id,
      amount: d.amount === null ? 0 : Number(d.amount),
      href: `/crm/deals/${d.id}`,
      values: {
        closeMonth: d.closeDate ? monthLabel(d.closeDate) : "",
        monthKey: d.closeDate ? d.closeDate.toISOString().slice(0, 7) : "",
        fiscalPeriod: fiscalPeriodOf(report) ?? "",
        type: dealType(report),
        accountName: d.client.name,
        name: d.name,
        owner: d.owner?.name ?? "",
        amount: String(d.amount === null ? 0 : Number(d.amount)),
        closeDate: usDate(d.closeDate),
        projectCompletionDate: usDate(d.projectCompletionDate),
        stage: d.stage === "CLOSED_WON" ? "Closed Won" : d.stage,
        createdDate: usDate(created),
        productName: d.lines[0]?.product?.name ?? d.lines[0]?.productName ?? "",
        // Salesforce exported its checkboxes as 0 and 1, and the report
        // printed them that way. Kept, so a column somebody compares against
        // the export matches it.
        subcontract: d.subcontract ? "1" : "0",
        billingContact: d.billingContact
          ? [d.billingContact.firstName, d.billingContact.lastName]
              .filter(Boolean)
              .join(" ")
          : "",
        leadSource: d.leadSource ?? "",
        nextStep: d.nextStep ?? "",
        probability: d.probability === null ? "" : String(d.probability / 100),
        age: age(created, d.closeDate),
      },
    };
  });

  return { deals, rows, allTypes: everyType };
}
