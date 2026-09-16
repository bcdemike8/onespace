import { OPEN_STAGES, STAGE_LABEL } from "@/lib/crm/view";
import type { DealStage } from "@prisma/client";

/**
 * Every deal, in the order somebody actually reads them.
 *
 * Pure: deals in, sections out. No database, no formatting, no colour - so
 * the banding and the subtotals can be checked against real deals rather
 * than against an idea of them.
 *
 * The page this feeds is one report rather than four filtered lists, because
 * the question "how are we doing" is answered by seeing the pipeline and the
 * recent wins on the same screen. A tab that shows one at a time makes you
 * hold the other in your head.
 */

export interface PipelineDeal {
  id: string;
  name: string;
  stage: DealStage;
  amount: number | null;
  closeDate: Date | null;
  isWon: boolean;
  isClosed: boolean;
  probability: number | null;
  clientId: string | null;
  clientName: string;
  ownerName: string | null;
  partnerName: string | null;
  businessType: string | null;
  consultantName: string | null;
  nextStep: string | null;
  /** When it was created, for deals with no close date to sort by. */
  createdAt: Date;
}

export type Band = "PIPELINE" | "WON" | "LOST";

export const bandOf = (d: PipelineDeal): Band =>
  !d.isClosed ? "PIPELINE" : d.isWon ? "WON" : "LOST";

export interface DealGroup {
  key: string;
  label: string;
  /** A second line under the heading, where one helps. */
  note?: string;
  deals: PipelineDeal[];
  total: number;
}

export interface Section {
  band: Band;
  label: string;
  /** What the total means here - forecast, revenue, or what was walked away from. */
  totalLabel: string;
  count: number;
  total: number;
  groups: DealGroup[];
}

const value = (d: PipelineDeal) => d.amount ?? 0;
const sum = (deals: PipelineDeal[]) => deals.reduce((s, d) => s + value(d), 0);

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** A date's month, as a sortable key and a readable label. */
function monthOf(d: Date): { key: string; label: string } {
  return {
    key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  };
}

/**
 * The open stages, closest to signing first.
 *
 * The reverse of the order the stage path draws them in, and deliberately so:
 * a path shows a journey and starts at the beginning, a pipeline shows work
 * and starts with what is about to land.
 */
export const PIPELINE_STAGE_ORDER: DealStage[] = [...OPEN_STAGES].reverse();

/**
 * Deals closing soonest first, then the undated.
 *
 * A deal with no close date is not "closing today" - it is unscheduled, and
 * sorting it to the top would put the least certain work where the most
 * urgent should be.
 */
function bySoonest(a: PipelineDeal, b: PipelineDeal): number {
  if (!a.closeDate && !b.closeDate) return b.createdAt.getTime() - a.createdAt.getTime();
  if (!a.closeDate) return 1;
  if (!b.closeDate) return -1;
  return a.closeDate.getTime() - b.closeDate.getTime();
}

/** Newest first. Undated deals fall back to when they were created. */
function byNewest(a: PipelineDeal, b: PipelineDeal): number {
  const at = a.closeDate?.getTime() ?? a.createdAt.getTime();
  const bt = b.closeDate?.getTime() ?? b.createdAt.getTime();
  return bt - at;
}

/**
 * The three sections, in reading order: what is still live, what was won,
 * what was lost.
 *
 * Pipeline is grouped by stage rather than by month, because "what is about
 * to close" is a stage question and a month grouping would scatter the four
 * deals at Contract across four headings. Won and lost are grouped by month,
 * newest first, so "recently" is a heading rather than a calculation.
 */
export function sections(deals: PipelineDeal[]): Section[] {
  const open = deals.filter((d) => bandOf(d) === "PIPELINE");
  const won = deals.filter((d) => bandOf(d) === "WON");
  const lost = deals.filter((d) => bandOf(d) === "LOST");

  return [
    {
      band: "PIPELINE",
      label: "In pipeline",
      totalLabel: "still open",
      count: open.length,
      total: sum(open),
      groups: byStage(open),
    },
    {
      band: "WON",
      label: "Closed won",
      totalLabel: "revenue",
      count: won.length,
      total: sum(won),
      groups: byMonthDesc(won),
    },
    {
      band: "LOST",
      label: "Closed lost",
      totalLabel: "not won",
      count: lost.length,
      total: sum(lost),
      groups: byMonthDesc(lost),
    },
  ];
}

function byStage(deals: PipelineDeal[]): DealGroup[] {
  const out: DealGroup[] = [];
  for (const stage of PIPELINE_STAGE_ORDER) {
    const inStage = deals.filter((d) => d.stage === stage).sort(bySoonest);
    if (inStage.length === 0) continue;
    out.push({
      key: stage,
      label: STAGE_LABEL[stage],
      deals: inStage,
      total: sum(inStage),
    });
  }

  // A deal whose stage is somehow not an open one but which isn't closed
  // either. Shouldn't happen now that the flags follow the stage; shown
  // rather than silently dropped, because a deal missing from the pipeline
  // is worse than a deal in an odd heading.
  const placed = new Set(out.flatMap((g) => g.deals.map((d) => d.id)));
  const rest = deals.filter((d) => !placed.has(d.id)).sort(bySoonest);
  if (rest.length > 0) {
    out.push({
      key: "__other",
      label: "Stage not recognised",
      note: "Open deals whose stage isn't one of the six. Worth a look.",
      deals: rest,
      total: sum(rest),
    });
  }
  return out;
}

function byMonthDesc(deals: PipelineDeal[]): DealGroup[] {
  const groups = new Map<string, DealGroup>();

  for (const d of [...deals].sort(byNewest)) {
    const when = d.closeDate ?? d.createdAt;
    const { key, label } = monthOf(when);
    const group = groups.get(key) ?? {
      key,
      label: d.closeDate ? label : `${label} — no close date`,
      deals: [],
      total: 0,
    };
    group.deals.push(d);
    group.total += value(d);
    groups.set(key, group);
  }

  return [...groups.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

export interface Summary {
  openCount: number;
  openValue: number;
  /** Open deals whose close date has already been and gone. */
  overdueCount: number;
  overdueValue: number;
  wonCount: number;
  wonValue: number;
  /** Won in the last 90 days - "recently", as a number. */
  recentWonCount: number;
  recentWonValue: number;
  lostCount: number;
  lostValue: number;
  /** Of the deals that reached a decision, the share won. */
  winRate: number | null;
  averageWon: number;
}

const DAY = 86_400_000;

export function summary(deals: PipelineDeal[], today = new Date()): Summary {
  const open = deals.filter((d) => bandOf(d) === "PIPELINE");
  const won = deals.filter((d) => bandOf(d) === "WON");
  const lost = deals.filter((d) => bandOf(d) === "LOST");

  const overdue = open.filter((d) => d.closeDate && d.closeDate < today);
  const since = new Date(today.getTime() - 90 * DAY);
  const recent = won.filter((d) => d.closeDate && d.closeDate >= since);

  const decided = won.length + lost.length;
  const wonValue = sum(won);

  return {
    openCount: open.length,
    openValue: sum(open),
    overdueCount: overdue.length,
    overdueValue: sum(overdue),
    wonCount: won.length,
    wonValue,
    recentWonCount: recent.length,
    recentWonValue: sum(recent),
    lostCount: lost.length,
    lostValue: sum(lost),
    winRate: decided ? won.length / decided : null,
    averageWon: won.length ? wonValue / won.length : 0,
  };
}
