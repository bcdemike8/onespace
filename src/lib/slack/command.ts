// Parsing and matching for `/onespace`. Pure — no database, no Slack — so the
// interesting part (does "log 1.5 licor kickoff" find the right project?) can be
// tested directly.

import { parseDuration } from "@/lib/format";

export type ParsedCommand =
  | { kind: "help" }
  | { kind: "today" }
  | { kind: "log"; minutes: number; text: string }
  | { kind: "error"; message: string };

export function parseCommand(raw: string): ParsedCommand {
  const input = raw.trim().replace(/\s+/g, " ");
  if (!input || /^(help|\?)$/i.test(input)) return { kind: "help" };
  if (/^(today|me|mine)$/i.test(input)) return { kind: "today" };

  const log = /^log\s+(\S+)\s*(.*)$/i.exec(input);
  if (!log) {
    return {
      kind: "error",
      message: `I don't know \`${input.split(" ")[0]}\`. Try \`/onespace help\`.`,
    };
  }

  const minutes = parseDuration(log[1]);
  if (minutes === null || minutes <= 0) {
    return {
      kind: "error",
      message: `\`${log[1]}\` isn't a duration I understand. Try \`1.5\`, \`1:30\` or \`90m\`.`,
    };
  }
  if (minutes > 24 * 60) {
    return { kind: "error", message: "That's more than 24 hours in one day." };
  }

  const text = log[2].trim();
  if (!text) {
    return {
      kind: "error",
      message: "Say what it was for — `/onespace log 1.5 Acme kickoff`.",
    };
  }

  return { kind: "log", minutes, text };
}

// ---------------------------------------------------------------- matching

const tokenise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

/** Tokens that carry no signal about which project someone means. */
const STOP = new Set([
  "the", "a", "an", "and", "for", "on", "with", "to", "of", "call", "meeting",
  "session", "work", "time", "hrs", "hr", "hours", "hour",
]);

export interface Candidate {
  id: string;
  name: string;
  /** Extra text to match against — a client name, say. */
  aka?: string | null;
}

export interface MatchResult<T extends Candidate> {
  best: T | null;
  /** Candidates tied with the best. Non-empty means "ask, don't guess". */
  tied: T[];
  /** Query tokens that didn't contribute to the match. */
  leftover: string[];
}

/**
 * Score every candidate against the words someone typed and return the winner,
 * or the tie so the caller can ask. Prefix matching both ways, so "licor" finds
 * "LI-COR" and "implementation" finds "Implement".
 */
export function matchCandidate<T extends Candidate>(
  text: string,
  candidates: T[],
): MatchResult<T> {
  const query = tokenise(text).filter((t) => !STOP.has(t));
  if (query.length === 0 || candidates.length === 0) {
    return { best: null, tied: [], leftover: query };
  }

  const scored = candidates.map((c) => {
    const full = `${c.name} ${c.aka ?? ""}`;
    const nameTokens = tokenise(full);
    // People type "licor", the project is called "LI-COR". Matching the
    // punctuation-free run of the name catches that without loosening the
    // per-word rules into matching everything.
    const squashed = nameTokens.join("");

    const used = new Set<string>();
    let score = 0;
    for (const q of query) {
      const hit =
        nameTokens.some(
          (n) =>
            n === q ||
            (q.length >= 3 && n.startsWith(q)) ||
            (n.length >= 3 && q.startsWith(n)),
        ) || (q.length >= 4 && squashed.includes(q));
      if (hit) {
        score += 1;
        used.add(q);
      }
    }
    return { candidate: c, score, used };
  });

  const top = Math.max(...scored.map((s) => s.score));
  if (top === 0) return { best: null, tied: [], leftover: query };

  const winners = scored.filter((s) => s.score === top);
  // A longer name matching the same number of words is the vaguer match, so the
  // shorter one wins. Genuine ties come back for the human to settle.
  winners.sort((a, b) => a.candidate.name.length - b.candidate.name.length);

  const shortest = winners[0].candidate.name.length;
  const tied = winners
    .filter((w) => w.candidate.name.length === shortest)
    .map((w) => w.candidate);

  if (tied.length > 1) return { best: null, tied, leftover: query };

  return {
    best: winners[0].candidate,
    tied: [],
    leftover: query.filter((q) => !winners[0].used.has(q)),
  };
}
