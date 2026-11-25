/**
 * "You said you'd do this" on My work, as rules rather than as a query.
 *
 * Each consultant's own action items from the last two weeks, grouped by the
 * project they belong to, each undertaking shown once however many calls it
 * came up on. Pure functions over plain data, so the window, the grouping and
 * the "is this the same thing?" judgement can be tested without a database.
 */
import { sinceOf, type Window } from "@/lib/window";

/** How far back My work offers things, unless an admin sets otherwise. */
export const QUEUE_DAYS_DEFAULT = "14";

/** The AppSetting that overrides it - a number of days, or a date. */
export const QUEUE_WINDOW_KEY = "mywork.queueWindow";

/**
 * Nothing said before this is offered, whatever the window says.
 *
 * The clean start: everything older came from the old pattern rules, and a
 * fortnight's window would otherwise reach back past it until 30 November.
 * Midnight on 16 November 2026, US Central. Once the window has moved past
 * it, it no longer does anything.
 */
export const QUEUE_FLOOR = new Date("2026-11-16T06:00:00Z");

/** The moment before which nothing is offered. */
export function queueStart(window: Window, now: Date = new Date(), floor: Date = QUEUE_FLOOR): Date {
  const since = sinceOf(window, now);
  return since > floor ? since : floor;
}

// ------------------------------------------------------------ sameness

const STOP = new Set([
  "a", "an", "the", "to", "for", "of", "and", "or", "on", "in", "at", "by",
  "with", "from", "about", "their", "them", "our", "your", "its", "it",
  "this", "that", "these", "those", "i", "we", "you", "they", "will", "ll",
  "be", "is", "are", "was", "so", "up", "over", "out", "into", "any",
]);

/** Lowercase words, punctuation gone. The key two copies of one item share. */
export function normalTask(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function contentWords(text: string): Set<string> {
  return new Set(normalTask(text).split(" ").filter((w) => w.length > 1 && !STOP.has(w)));
}

function overlap(a: string, b: string): number {
  const x = contentWords(a);
  const y = contentWords(b);
  if (x.size === 0 || y.size === 0) return 0;
  let shared = 0;
  for (const w of x) if (y.has(w)) shared += 1;
  return shared / (x.size + y.size - shared);
}

/**
 * Is this the same undertaking as one somebody already ruled on?
 *
 * Asked when a call is read again. Claude rarely words a title the same way
 * twice, so exact matching let dismissed items come back reworded. The quote
 * is the steadier signal - it's the sentence as said - so either the quotes
 * or the titles being mostly the same words is enough.
 */
export function sameUndertaking(
  a: { title: string; quote?: string | null },
  b: { title: string; quote?: string | null },
): boolean {
  if (normalTask(a.title) === normalTask(b.title)) return true;
  if (a.quote && b.quote && overlap(a.quote, b.quote) >= 0.6) return true;
  return overlap(a.title, b.title) >= 0.6;
}

// ------------------------------------------------------------ grouping

export type QueueSourceKind = "TRANSCRIPT" | "ZOOM_SUMMARY" | "RECAP_EMAIL" | "AI_SUMMARY";

/** One stored action item, as the page reads it. */
export interface QueueRecord {
  id: string;
  title: string;
  quote: string;
  detail: string | null;
  source: QueueSourceKind;
  dueDate: Date | null;
  dueStated: boolean;
  /** When it was said or written. */
  saidAt: Date;
  /** The call or thread it came from - repeats are counted by this. */
  originKey: string;
  originLabel: string;
  originHref: string | null;
  /** The project the call or thread is filed against, or suggested for. */
  projectId: string | null;
  /** A name was given that matched nobody - the host is holding it. */
  ownerUnrecognised: boolean;
  /** The name as given, shown when it couldn't be matched. */
  speaker: string | null;
}

/** One row on screen - possibly several stored items said more than once. */
export interface QueueItem {
  /** Every stored item this row stands for. Acting on the row acts on all. */
  ids: string[];
  title: string;
  quote: string;
  detail: string | null;
  source: QueueSourceKind;
  /** ISO day, for the date input. */
  dueDate: string | null;
  dueStated: boolean;
  originLabel: string;
  originHref: string | null;
  /** How many calls or threads it came up on. */
  calls: number;
  projectId: string | null;
  ownerUnrecognised: boolean;
  speaker: string | null;
}

export interface QueueGroup {
  /** The project id, or "unfiled". */
  key: string;
  projectId: string | null;
  projectName: string | null;
  clientName: string | null;
  items: QueueItem[];
}

export interface QueueProjectInfo {
  name: string;
  clientName: string | null;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * The records, as project groups of de-duplicated rows.
 *
 * A project that isn't offered for logging (finished, archived) counts as
 * not filed: an action item can only be added to a project that's open.
 * Groups run alphabetically by client then project, with "not filed" last.
 * Within a group, the soonest due first, then the most recently said.
 */
export function groupQueue(
  records: QueueRecord[],
  projects: Map<string, QueueProjectInfo>,
): QueueGroup[] {
  const sorted = [...records].sort((a, b) => {
    const ad = a.dueDate?.getTime() ?? Infinity;
    const bd = b.dueDate?.getTime() ?? Infinity;
    if (ad !== bd) return ad - bd;
    return b.saidAt.getTime() - a.saidAt.getTime();
  });

  const groups = new Map<string, QueueGroup>();
  const rows = new Map<string, { item: QueueItem; origins: Set<string> }>();

  for (const r of sorted) {
    const info = r.projectId ? projects.get(r.projectId) : undefined;
    const projectId = info ? r.projectId : null;
    const key = projectId ?? "unfiled";

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        projectId,
        projectName: info?.name ?? null,
        clientName: info?.clientName ?? null,
        items: [],
      };
      groups.set(key, group);
    }

    const rowKey = `${key}|${normalTask(r.title)}`;
    const existing = rows.get(rowKey);
    if (existing) {
      existing.item.ids.push(r.id);
      existing.origins.add(r.originKey);
      existing.item.calls = existing.origins.size;
      // Held by the host only while every copy is unplaced.
      existing.item.ownerUnrecognised &&= r.ownerUnrecognised;
      continue;
    }

    const item: QueueItem = {
      ids: [r.id],
      title: r.title,
      quote: r.quote,
      detail: r.detail,
      source: r.source,
      dueDate: r.dueDate ? iso(r.dueDate) : null,
      dueStated: r.dueStated,
      originLabel: r.originLabel,
      originHref: r.originHref,
      calls: 1,
      projectId,
      ownerUnrecognised: r.ownerUnrecognised,
      speaker: r.speaker,
    };
    rows.set(rowKey, { item, origins: new Set([r.originKey]) });
    group.items.push(item);
  }

  const label = (g: QueueGroup) =>
    `${g.clientName ?? ""} ${g.projectName ?? ""}`.trim().toLowerCase();

  return [...groups.values()].sort((a, b) => {
    if (a.projectId === null) return 1;
    if (b.projectId === null) return -1;
    return label(a).localeCompare(label(b));
  });
}

/** Rows across every group - the number the heading shows. */
export const queueCount = (groups: QueueGroup[]) =>
  groups.reduce((n, g) => n + g.items.length, 0);
