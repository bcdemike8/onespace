// Not server-only: the Deals page, the report behind it and the CSV route all
// import this, and all three are server-side. It reaches for @/lib/db, which
// check:client already keeps away from client components.
import { db } from "@/lib/db";
import type { PipelineDeal } from "@/lib/crm/pipeline";

/**
 * One query behind the Deals page, its report and the CSV.
 *
 * The same argument as the dashboard's loader: a page whose headline says
 * $1,825,015 and whose "View report" says something else is worse than
 * having neither, and the usual cause is three queries written a week apart
 * with slightly different ideas of what counts.
 */

export interface DealQuery {
  q?: string;
  owner?: string;
  type?: string;
  year?: string;
}

/** Everything the report and the page both need to know. */
export interface LoadedDeals {
  deals: PipelineDeal[];
  /** How many match before the cap. */
  total: number;
  owners: string[];
  partners: string[];
  years: number[];
}

const NAME_MATCH = (q: string) =>
  q.length < 2
    ? {}
    : {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { client: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      };

export function dealWhereFrom(query: DealQuery) {
  const q = (query.q ?? "").trim();
  const year = query.year && /^\d{4}$/.test(query.year) ? Number(query.year) : null;

  return {
    ...NAME_MATCH(q),
    ...(query.owner ? { owner: { name: query.owner } } : {}),
    ...(query.type === "Direct"
      ? { partnerId: null }
      : query.type
        ? { partner: { name: query.type } }
        : {}),
    ...(year
      ? {
          closeDate: {
            gte: new Date(Date.UTC(year, 0, 1)),
            lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
          },
        }
      : {}),
  };
}

export async function loadDeals(
  query: DealQuery,
  limit: number,
): Promise<LoadedDeals> {
  const where = dealWhereFrom(query);

  const [rows, total, owners, partners, closeDates] = await Promise.all([
    db.deal.findMany({
      where,
      // Which deals survive the cap, and nothing else - the report and the
      // page each order again for themselves. Newest first, because if
      // something has to be dropped it should be the oldest.
      orderBy: [{ closeDate: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        closeDate: true,
        isWon: true,
        isClosed: true,
        probability: true,
        nextStep: true,
        businessType: true,
        createdAt: true,
        client: { select: { id: true, name: true } },
        owner: { select: { name: true } },
        partner: { select: { name: true } },
        leadConsultant: { select: { name: true } },
      },
    }),
    db.deal.count({ where }),
    db.user.findMany({
      where: { ownedDeals: { some: {} } },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    db.partner.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    db.deal.findMany({
      where: { closeDate: { not: null } },
      select: { closeDate: true },
      orderBy: { closeDate: "desc" },
      distinct: ["closeDate"],
      take: 3000,
    }),
  ]);

  return {
    deals: rows.map((d) => ({
      id: d.id,
      name: d.name,
      stage: d.stage,
      amount: d.amount === null ? null : Number(d.amount),
      closeDate: d.closeDate,
      isWon: d.isWon,
      isClosed: d.isClosed,
      probability: d.probability,
      clientId: d.client.id,
      clientName: d.client.name,
      ownerName: d.owner?.name ?? null,
      partnerName: d.partner?.name ?? null,
      businessType: d.businessType,
      consultantName: d.leadConsultant?.name ?? null,
      nextStep: d.nextStep,
      createdAt: d.createdAt,
    })),
    total,
    owners: owners.map((o) => o.name),
    partners: partners.map((p) => p.name),
    years: [...new Set(closeDates.map((y) => y.closeDate!.getUTCFullYear()))].sort(
      (a, b) => b - a,
    ),
  };
}
