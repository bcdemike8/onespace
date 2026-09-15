import type { AiRead } from "@/lib/ai/summarise";

/**
 * Zoom's own AI Companion summary, in the shape a write-up is stored in.
 *
 * Zoom has two features that both call themselves "Transcript", and the
 * difference is why this was needed. The Transcripts tab holds the classic
 * audio transcript - a .vtt file, listed among a recording's files, and the
 * thing OneSpace reads. Smart Recording is a separate feature that produces
 * its own transcript view and an AI summary, stored elsewhere and exposed by
 * a different endpoint entirely.
 *
 * An account can have the second without the first. Then Zoom shows a
 * "Transcript" badge on every recording, the Transcripts tab is empty for
 * those dates, OneSpace correctly reports no transcript, and everybody is
 * telling the truth about a different file.
 *
 * The sync already asked for the AI summary in that case - but only to mine
 * its next steps for tasks, throwing the summary itself away. So Zoom would
 * have written a perfectly good account of the call and OneSpace would show
 * "no write-up" beside it. This keeps the words.
 */

export type ZoomSummaryShape = {
  summary_overview?: string;
  summary_details?: { label?: string; summary?: string }[];
  next_steps?: string[];
};

/** Zoom's summary is its own author, and the data should say so. */
export const ZOOM_AI_MODEL = "zoom-ai-companion";

const clean = (s: unknown): string =>
  typeof s === "string" ? s.trim() : "";

export function readFromZoomSummary(
  summary: ZoomSummaryShape | null | undefined,
): AiRead | null {
  if (!summary) return null;

  const overview = clean(summary.summary_overview);

  const sections = (summary.summary_details ?? [])
    .map((d) => ({
      heading: clean(d.label) || "Summary",
      // Kept whole. Zoom writes a paragraph per heading, and splitting it
      // into sentences to look more like bullets would only mangle it.
      bullets: [clean(d.summary)].filter(Boolean),
    }))
    .filter((s) => s.bullets.length > 0);

  const nextSteps = (summary.next_steps ?? []).map(clean).filter(Boolean);

  // Nothing worth keeping. Say so rather than storing an empty write-up,
  // which would read as "summarised, and the call was empty".
  if (!overview && sections.length === 0 && nextSteps.length === 0) return null;

  if (nextSteps.length > 0) {
    sections.push({ heading: "Next steps", bullets: nextSteps });
  }

  return {
    overview:
      overview ||
      "Zoom summarised this call. There was no headline, so the detail is below.",
    sections,
    // Zoom doesn't do the second, finer pass that Claude does. An empty
    // outline is honest; inventing one from the sections would not be.
    outline: [],
    // Deliberately empty. The next steps become suggested tasks through the
    // commitments path, and listing them here as well would offer the same
    // work twice.
    actionItems: [],
    model: ZOOM_AI_MODEL,
  };
}
