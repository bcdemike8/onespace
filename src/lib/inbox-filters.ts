/**
 * Narrowing the inbox down.
 *
 * Fifty threads across a dozen engagements is a list you scroll rather than
 * a list you work. Two questions cut it down: which piece of work is this
 * about, and is the ball in my court? Both live in the URL, so a filtered
 * inbox is a link somebody can keep.
 */

/** Which side owes the next message. */
export type ReplyFilter = "all" | "waiting" | "replied";

export const REPLY_FILTERS: { value: ReplyFilter; label: string }[] = [
  { value: "all", label: "Anything" },
  { value: "waiting", label: "Waiting on you" },
  { value: "replied", label: "You replied last" },
];

export function asReplyFilter(value: string | undefined): ReplyFilter {
  return value === "waiting" || value === "replied" ? value : "all";
}

/** The Prisma condition for a reply filter. Empty object means no condition. */
export function replyWhere(reply: ReplyFilter): { awaitingUs?: boolean } {
  if (reply === "waiting") return { awaitingUs: true };
  if (reply === "replied") return { awaitingUs: false };
  return {};
}

/**
 * The `which` parameter, resolved to a Prisma condition.
 *
 * Four shapes, because "project" isn't quite the whole question. A thread
 * can be matched to a client before anyone has filed it against a project,
 * and a client can have two engagements running at once:
 *
 *   project:<id>        one engagement
 *   client:<id>         everything for that client
 *   client:<id>:none    that client, not filed to a project yet
 *   unfiled             no client either - the matcher couldn't tell
 */
export function whichWhere(which: string | undefined): Record<string, unknown> {
  if (!which) return {};
  if (which === "unfiled") return { clientId: null, projectId: null };

  const [kind, id, rest] = which.split(":");
  if (kind === "project" && id) return { projectId: id };
  if (kind === "client" && id) {
    if (rest === "none") return { clientId: id, projectId: null };
    // A thread can be filed against one of the client's projects while its
    // own client column never got set - two client domains on the thread and
    // no confident match. It still belongs to that client.
    return { OR: [{ clientId: id }, { project: { clientId: id } }] };
  }
  // An id that no longer exists, or a hand-edited URL. Show everything
  // rather than an empty list nobody can explain.
  return {};
}

/** One row of the grouped count query behind the dropdown. */
export interface ThreadCount {
  clientId: string | null;
  projectId: string | null;
  count: number;
}

/**
 * Put a thread under the client it belongs to, even when its own client
 * column is empty.
 *
 * The matcher leaves clientId null when two client domains are on the same
 * thread and it can't choose. If somebody has since filed it against a
 * project, the project knows the answer - and "No client matched" sitting
 * next to a named project reads like a bug.
 */
export function attributeRows(
  grouped: ThreadCount[],
  projectClient: Map<string, string | null>,
): ThreadCount[] {
  const merged = new Map<string, ThreadCount>();

  for (const row of grouped) {
    const clientId =
      row.clientId ??
      (row.projectId ? (projectClient.get(row.projectId) ?? null) : null);

    // The database grouped by the client column, so the same project can
    // arrive twice - once for the threads that named the client and once
    // for the ones that didn't. Attributing them puts both under the same
    // heading, and two rows there would be two identical dropdown entries
    // each showing half the count.
    const key = `${clientId ?? ""}\u0000${row.projectId ?? ""}`;
    const seen = merged.get(key);
    if (seen) seen.count += row.count;
    else merged.set(key, { ...row, clientId });
  }

  return [...merged.values()];
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

/** An optgroup: one client, and the engagements under it. */
export interface FilterGroup {
  label: string | null;
  options: FilterOption[];
}

/**
 * Build the dropdown from what's actually in the inbox.
 *
 * Only clients and projects with threads appear. A dropdown listing every
 * project RevOptics has ever run is a dropdown where most choices lead to
 * an empty page.
 */
export function filterOptions(
  rows: ThreadCount[],
  names: { clients: Map<string, string>; projects: Map<string, string> },
): FilterGroup[] {
  const byClient = new Map<string, ThreadCount[]>();
  let unfiled = 0;

  for (const row of rows) {
    if (!row.clientId) {
      unfiled += row.count;
      continue;
    }
    const list = byClient.get(row.clientId);
    if (list) list.push(row);
    else byClient.set(row.clientId, [row]);
  }

  const groups: FilterGroup[] = [];

  for (const [clientId, list] of byClient) {
    const clientName = names.clients.get(clientId) ?? "Unknown client";
    const total = list.reduce((sum, r) => sum + r.count, 0);

    const options: FilterOption[] = list
      .filter((r) => r.projectId)
      .map((r) => ({
        value: `project:${r.projectId}`,
        label: names.projects.get(r.projectId!) ?? "Untitled project",
        count: r.count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const loose = list
      .filter((r) => !r.projectId)
      .reduce((sum, r) => sum + r.count, 0);
    if (loose > 0) {
      options.push({
        value: `client:${clientId}:none`,
        label: "Not filed to a project",
        count: loose,
      });
    }

    // "All of Avam" only earns its place when there's more than one thing
    // under it - otherwise it's a second way to pick the same threads.
    if (options.length > 1) {
      options.unshift({
        value: `client:${clientId}`,
        label: `All of ${clientName}`,
        count: total,
      });
    }

    groups.push({ label: clientName, options });
  }

  groups.sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""));

  if (unfiled > 0) {
    groups.push({
      label: null,
      options: [
        { value: "unfiled", label: "No client matched", count: unfiled },
      ],
    });
  }

  return groups;
}

/** What the current `which` is called, for the summary line. */
export function filterLabel(
  groups: FilterGroup[],
  which: string | undefined,
): string | null {
  if (!which) return null;
  for (const group of groups) {
    for (const option of group.options) {
      if (option.value !== which) continue;
      if (!group.label) return option.label;
      // "Avam — Quick Start" reads on its own; "Avam — All of Avam" doesn't.
      return option.label.startsWith("All of ")
        ? option.label
        : `${group.label} — ${option.label}`;
    }
  }
  return null;
}

const KEYS = ["who", "show", "which", "reply"] as const;
type Key = (typeof KEYS)[number];

/**
 * A link to the inbox with one thing changed.
 *
 * Every control on the page goes through this, so picking a client doesn't
 * silently throw away the Done tab and marking the Everyone view doesn't
 * throw away the client. Pass null to drop a parameter.
 */
export function inboxHref(
  current: Partial<Record<Key, string | undefined>>,
  change: Partial<Record<Key, string | null>> = {},
): string {
  const query = new URLSearchParams();
  for (const key of KEYS) {
    const value = key in change ? change[key] : current[key];
    // "all" is what the page does with no parameter at all; leaving it out
    // keeps the unfiltered inbox at a bare /inbox.
    if (value && !(key === "reply" && value === "all")) query.set(key, value);
  }
  const search = query.toString();
  return search ? `/inbox?${search}` : "/inbox";
}
