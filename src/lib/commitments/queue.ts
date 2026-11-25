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

/**
 * A word without its common ending, so "sequences" and "sequence", "syncing"
 * and "sync", count as the same word. Deliberately light - just enough that
 * a call and its recap, worded a little differently, read as one promise.
 */
function stem(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function contentWords(text: string): Set<string> {
  return new Set(
    normalTask(text)
      .split(" ")
      .filter((w) => w.length > 1 && !STOP.has(w))
      .map(stem),
  );
}

/**
 * Words every task title has - the verb, mostly - so sharing them says
 * nothing about whether two titles are the same deliverable.
 */
const ACTION_WORDS = new Set([
  "send", "share", "get", "give", "provide", "deliver", "updat", "draft",
  "create", "build", "prepare", "put", "together", "set", "run", "review",
  "follow", "confirm", "schedule", "book", "new", "revis", "final", "team",
]);

/** The words naming the deliverable - content words, less the verbs every title has. */
function thingWords(text: string): Set<string> {
  return new Set([...contentWords(text)].filter((w) => !ACTION_WORDS.has(w)));
}

/** One title is the other said more fully: "Book the training" / "Book Northwind's admin training". */
function narrows(a: string, b: string): boolean {
  const x = thingWords(a);
  const y = thingWords(b);
  if (x.size === 0 || y.size === 0) return false;
  const [small, big] = x.size <= y.size ? [x, y] : [y, x];
  return [...small].every((w) => big.has(w));
}

function compare(a: string, b: string): { shared: number; things: number; overlap: number } {
  const x = contentWords(a);
  const y = contentWords(b);
  if (x.size === 0 || y.size === 0) return { shared: 0, things: 0, overlap: 0 };
  let shared = 0;
  let things = 0;
  for (const w of x) {
    if (!y.has(w)) continue;
    shared += 1;
    if (!ACTION_WORDS.has(w)) things += 1;
  }
  return { shared, things, overlap: shared / (x.size + y.size - shared) };
}

/**
 * Is this the same undertaking as another?
 *
 * Asked when a source is read again (so a dismissed item doesn't come back
 * reworded), when My work shows a row (so one promise said twice is one
 * row), and against what the person already added or dismissed.
 *
 * Same when the titles are the same, or nearly all the same words. Or when
 * the quotes are mostly the same words AND the titles share at least two
 * words about the thing itself, not the verb - one sentence can hold two
 * promises ("the sequences tomorrow and the recommendations by Friday"),
 * and "Send Northwind the..." in both titles mustn't make them one. The
 * customer's name can be one of the two, so a re-worded "Send Acme the
 * sequence spec" still matches "Share the revised sequence specification
 * with Acme".
 */
export function sameUndertaking(
  a: { title: string; quote?: string | null },
  b: { title: string; quote?: string | null },
): boolean {
  if (normalTask(a.title) === normalTask(b.title)) return true;
  const titles = compare(a.title, b.title);
  if (titles.overlap >= 0.8) return true;
  if (a.quote && b.quote && compare(a.quote, b.quote).overlap >= 0.6) {
    // Same sentence: the same thing if the titles share two words about it,
    // or one title is just the other said more fully. Two deliverables from
    // one sentence ("the sequences ... and the recommendations") share
    // neither.
    return (titles.things >= 2 && titles.overlap >= 0.25) || narrows(a.title, b.title);
  }
  return false;
}

/**
 * The records, less anything this person already added or dismissed.
 *
 * Per source that's handled when it's read. This catches the same promise
 * arriving from somewhere else - said on Tuesday's call, added as a task,
 * then written again in Wednesday's recap.
 */
export function withoutDecided<T extends { title: string; quote: string; projectId: string | null }>(
  records: T[],
  decided: { title: string; quote: string; projectId: string | null }[],
): T[] {
  return records.filter(
    (r) =>
      !decided.some(
        (d) =>
          (d.projectId === null || r.projectId === null || d.projectId === r.projectId) &&
          sameUndertaking(r, d),
      ),
  );
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
  const rows = new Map<string, { item: QueueItem; origins: Set<string> }[]>();

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

    // One promise said twice - on two calls, or a call and its recap - is
    // one row, if it's recognisably the same undertaking.
    const inGroup = rows.get(key) ?? [];
    const existing = inGroup.find((row) =>
      sameUndertaking({ title: r.title, quote: r.quote }, { title: row.item.title, quote: row.item.quote }),
    );
    if (existing) {
      existing.item.ids.push(r.id);
      existing.origins.add(r.originKey);
      existing.item.calls = existing.origins.size;
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
    };
    inGroup.push({ item, origins: new Set([r.originKey]) });
    rows.set(key, inGroup);
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
