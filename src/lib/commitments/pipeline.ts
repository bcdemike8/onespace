/**
 * The checks every action item passes between Claude and My work.
 *
 * Claude decides what was undertaken and by whom. This file decides whether
 * to believe it - the same checks for calls and recap emails, and the same
 * checks the accuracy script (scripts/eval-commitments.ts) runs, so what it
 * measures is what reaches people's lists.
 *
 * An item reaches a personal list only if all of these hold:
 *  - Claude marked it RevOptics' ("ours"), with one named owner;
 *  - the owner is a OneSpace person, and was on the call (host, invitee or
 *    speaker), sent the email, or is mentioned by name in it;
 *  - the supporting quote is really in the transcript or email;
 *  - the title and instruction are whole, not a sentence fragment.
 *
 * Pure functions, no database.
 */
import type { NameIndex } from "@/lib/commitments/owner";
import { parseWhen } from "@/lib/when";

/** What Claude hands back for one action item. */
export interface Candidate {
  title: string;
  task: string;
  owner: string | null;
  ours: boolean;
  when: string | null;
  quote: string;
}

/** What the reading was of, and who is known to have been part of it. */
export interface SourceEvidence {
  /** The text Claude read - the transcript, or the email's own words. */
  text: string;
  /** OneSpace people known to be in it: host, invitees, speakers; the sender. */
  presentIds: Set<string>;
}

export interface Person {
  id: string;
  name: string;
}

export interface Vetted<T> {
  /** On the owner's My work. */
  owned: (T & { ownerId: string })[];
  /**
   * Plausibly ours, but whose can't be established - a name that matches
   * nobody, or somebody who wasn't there. Kept on the call's own page for
   * whoever reads it; never put on anybody's personal list.
   */
  unidentified: { item: T; reason: string }[];
  /** Not an action item we believe. Not stored. */
  rejected: { item: T; reason: string }[];
}

/** Lowercase words, punctuation and curly quotes gone. */
export function normalText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}']+/gu, " ")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Is this quote really in the source?
 *
 * Verbatim after tidying, or - because Claude sometimes drops a filler word or
 * stitches across a transcript's line breaks - nearly all of it in runs of
 * five consecutive words. A quote that isn't there can't be evidence.
 */
export function quoteInSource(quote: string, source: string): boolean {
  const q = normalText(quote);
  const words = q.split(" ").filter(Boolean);
  if (words.length < 4) return false;
  const s = ` ${normalText(source)} `;
  if (s.includes(` ${q} `)) return true;

  const span = 5;
  if (words.length < span) return false;
  let found = 0;
  let total = 0;
  for (let i = 0; i + span <= words.length; i += 1) {
    total += 1;
    if (s.includes(` ${words.slice(i, i + span).join(" ")} `)) found += 1;
  }
  return found / total >= 0.8;
}

/** Words a whole title or sentence doesn't end on. */
const DANGLING = new Set([
  "a", "an", "the", "to", "of", "and", "or", "but", "whether", "for", "with",
  "on", "in", "at", "by", "from", "that", "if", "so", "as", "into", "about",
]);

/** A cut-off piece of a sentence rather than the whole thing. */
export function looksLikeFragment(text: string): boolean {
  const words = normalText(text).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  return DANGLING.has(words[words.length - 1]);
}

/** Is this person named in the text - first name, or whole name? */
export function namedIn(name: string, text: string): boolean {
  const t = ` ${normalText(text)} `;
  const full = normalText(name);
  const first = full.split(" ")[0];
  return (full.length > 0 && t.includes(` ${full} `)) || (first.length > 1 && t.includes(` ${first} `));
}

/**
 * Sort Claude's action items into owned, unidentified and rejected.
 *
 * The order of the checks is the order of the reasons a person would give:
 * not ours; no evidence; not a whole task; nobody named; named but not one of
 * us; one of us but not there.
 */
export function vetActionItems<T extends Candidate>(
  items: T[],
  index: NameIndex,
  people: Person[],
  source: SourceEvidence,
): Vetted<T> {
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  const out: Vetted<T> = { owned: [], unidentified: [], rejected: [] };

  for (const item of items) {
    if (!item.ours) {
      out.rejected.push({ item, reason: "the customer's, or nobody's" });
      continue;
    }
    if (!quoteInSource(item.quote, source.text)) {
      out.rejected.push({ item, reason: "its quote isn't in the source" });
      continue;
    }
    if (
      item.title.split(/\s+/).filter(Boolean).length < 3 ||
      item.task.split(/\s+/).filter(Boolean).length < 4 ||
      looksLikeFragment(item.title) ||
      looksLikeFragment(item.quote)
    ) {
      out.rejected.push({ item, reason: "not a whole task" });
      continue;
    }
    const owner = item.owner?.trim();
    if (!owner) {
      out.rejected.push({ item, reason: "no single RevOptics owner named" });
      continue;
    }
    const id = index.match(owner);
    if (!id) {
      out.unidentified.push({
        item,
        reason:
          id === null
            ? `"${owner}" could be more than one OneSpace person`
            : `"${owner}" isn't a OneSpace person`,
      });
      continue;
    }
    const there =
      source.presentIds.has(id) || namedIn(nameOf.get(id) ?? owner, source.text);
    if (!there) {
      out.unidentified.push({
        item,
        reason: `"${owner}" wasn't on this and isn't mentioned in it`,
      });
      continue;
    }
    out.owned.push({ ...item, ownerId: id });
  }

  return out;
}

/**
 * The deadline that was actually given, or none.
 *
 * Only Claude's isolated timing phrase is read - "by Friday", "before the
 * Tuesday check-in" - and only against the day it was said. No phrase, or one
 * that doesn't name a day, is no date: a calculated one would read on My work
 * as something promised to the customer.
 */
export function promisedDate(when: string | null, said: Date): Date | null {
  const phrase = when?.trim();
  return phrase ? parseWhen(phrase, said) : null;
}

/**
 * Whose recap this copy is, if it's the one to read.
 *
 * The person who actually sent the message, matched by email address - not
 * whoever's mailbox it turned up in. And only from the sender's own mailbox:
 * a recap a colleague was copied on is in their mailbox too, and reading
 * both copies would offer the same items twice.
 */
export function recapSender<P extends { id: string }>(
  fromEmail: string,
  mailboxUserId: string,
  byEmail: Map<string, P>,
): P | null {
  const sender = byEmail.get(fromEmail.trim().toLowerCase());
  return sender && sender.id === mailboxUserId ? sender : null;
}
