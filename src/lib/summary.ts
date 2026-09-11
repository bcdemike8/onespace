/**
 * The shape of a call write-up, and how to trust one off the database.
 *
 * Plain module, deliberately. This lived in CallSummary.tsx next to the
 * component that renders it, which is marked "use client" - so the server
 * pages that called asSummaryDoc() got a client reference rather than the
 * function, and threw at render with data present. The build was clean and
 * TypeScript had no opinion; only a page with a real summary on it failed.
 *
 * Types and pure helpers shared across the boundary belong here, where
 * neither side is a client module.
 */

export interface SummarySection {
  heading: string;
  bullets: string[];
}

export interface SummaryDoc {
  overview: string;
  sections: SummarySection[];
  outline: SummarySection[];
  actionItems: {
    task: string;
    owner: string | null;
    ours: boolean;
    when: string | null;
  }[];
}

/** Narrow whatever came out of the database, or null if it isn't one. */
export function asSummaryDoc(value: unknown): SummaryDoc | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.overview !== "string") return null;

  const sections = (raw: unknown): SummarySection[] =>
    Array.isArray(raw)
      ? raw
          .filter(
            (s): s is { heading: string; bullets: string[] } =>
              !!s &&
              typeof s === "object" &&
              typeof (s as { heading?: unknown }).heading === "string" &&
              Array.isArray((s as { bullets?: unknown }).bullets),
          )
          .map((s) => ({
            heading: s.heading,
            bullets: s.bullets.filter((b): b is string => typeof b === "string"),
          }))
      : [];

  return {
    overview: v.overview,
    sections: sections(v.sections),
    outline: sections(v.outline),
    actionItems: Array.isArray(v.actionItems)
      ? (v.actionItems as Record<string, unknown>[])
          .filter((a) => typeof a?.task === "string")
          .map((a) => ({
            task: a.task as string,
            owner: typeof a.owner === "string" ? a.owner : null,
            ours: a.ours !== false,
            when: typeof a.when === "string" ? a.when : null,
          }))
      : [],
  };
}
