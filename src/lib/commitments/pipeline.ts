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
  /**
   * A call transcript, as "Name: words" turns, or an email from one sender.
   * It decides how the quote is tied to a person: by who spoke it, or by the
   * sender writing it.
   */
  kind: "call" | "email";
  /** The text Claude read - the transcript, or the email's own words. */
  text: string;
  /** OneSpace people known to be in it: host, invitees, speakers; the sender. */
  presentIds: Set<string>;
  /** For an email, the OneSpace person who sent it. */
  senderId?: string;
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

/** One speaker's turn in a transcript. */
export interface Turn {
  speaker: string | null;
  text: string;
}

const SPEAKER = /^\s*([^:\n]{1,60}):\s+(.*)$/;

/** A transcript as Claude receives it, back into who said what. */
export function turnsOf(transcript: string): Turn[] {
  const turns: Turn[] = [];
  for (const line of transcript.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = SPEAKER.exec(line);
    if (m) turns.push({ speaker: m[1].trim(), text: m[2] });
    else if (turns.length > 0) turns[turns.length - 1].text += ` ${line}`;
    else turns.push({ speaker: null, text: line });
  }
  return turns;
}

/**
 * The turns a quote is drawn from.
 *
 * A quote for an accepted request runs across two speakers - the customer
 * asking, the consultant agreeing - so it's matched turn by turn: a turn
 * counts if it holds a run of three of the quote's words in a row.
 */
function turnsOfQuote(quote: string, turns: Turn[]): Turn[] {
  const words = normalText(quote).split(" ").filter(Boolean);
  const span = Math.min(3, words.length);
  const runs: string[] = [];
  for (let i = 0; i + span <= words.length; i += 1) runs.push(words.slice(i, i + span).join(" "));
  return turns.filter((t) => {
    const said = ` ${normalText(t.text)} `;
    return runs.some((r) => said.includes(` ${r} `));
  });
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
 * Is this person named as the one doing something - "Sam will...", "Sam to
 * build...", "Sam's going to...", "Sam can take..." - rather than just
 * mentioned ("I'll ask Sam about it")?
 */
export function namedAsDoer(name: string, text: string): boolean {
  const t = normalText(text);
  const full = normalText(name);
  const first = full.split(" ")[0];
  const who = [full, first].filter((n) => n.length > 1).join("|");
  if (!who) return false;
  return new RegExp(
    // Apostrophes are gone by now: "Sam's going to" reads "sams going to",
    // "Sam'll" reads "samll".
    `\\b(${who})(s| [a-z-]+)? (will|going to|is going to|to|can|owns|is taking|takes|is handling|handles)\\b|\\b(${who})ll\\b`,
  ).test(t);
}

/** Words only the person writing uses about themselves. */
const FIRST_PERSON = /\b(i|i'?ll|i'?m|i'?ve|i'?d|me|my|myself)\b/i;

/**
 * Does the quote show this person taking the work on?
 *
 * Being named, or being on the call, isn't ownership. On a call the quote has
 * to include the owner's own words, or a RevOptics colleague naming them as
 * the one doing it ("Sam will...") - a customer saying "Sam will sort it"
 * doesn't make it Sam's until Sam agrees, and "I'll ask Sam about it" isn't
 * Sam's at all. In an email the sender has to be writing about themselves
 * ("I'll..."), or naming the colleague they're committing.
 *
 * "ours" when a RevOptics person said or wrote the quote at all, so a quote
 * that's entirely the customer's can be told apart from one that names the
 * wrong one of us.
 */
export function quoteSupports(
  quote: string,
  ownerId: string,
  ownerName: string,
  source: SourceEvidence,
  index: NameIndex,
): { owner: boolean; ours: boolean } {
  if (source.kind === "email") {
    const byOwner = ownerId === source.senderId && FIRST_PERSON.test(quote.replace(/[’‘]/g, "'"));
    return { owner: byOwner || namedAsDoer(ownerName, quote), ours: true };
  }
  const turns = turnsOfQuote(quote, turnsOf(source.text));
  let ours = false;
  let owner = false;
  for (const t of turns) {
    const id = index.match(t.speaker);
    if (!id) continue;
    ours = true;
    if (id === ownerId || namedAsDoer(ownerName, t.text)) owner = true;
  }
  return { owner, ours };
}

/** A timing phrase too loose to be a date anyone promised. */
const VAGUE_WHEN =
  /\b(some ?time|around|roughly|approximately|early|mid|couple|few|several|soon|asap|shortly|hopefully|ideally|maybe|probably|at some point|whenever|eventually|later)\b/i;

/**
 * The deadline phrase, if it is one this commitment actually carries.
 *
 * It has to be in the commitment's own quote - so the customer's "by Friday"
 * elsewhere in the conversation, or the meeting's own date, can't attach to
 * it - and it has to be specific. "Next week", "in a few days" and "soon" are
 * left blank rather than turned into a day nobody named; "by the end of next
 * week" is kept.
 */
export function promisedWhen(when: string | null, quote: string): string | null {
  const phrase = when?.trim();
  if (!phrase) return null;
  if (!` ${normalText(quote)} `.includes(` ${normalText(phrase)} `)) return null;
  if (VAGUE_WHEN.test(phrase)) return null;
  if (/\b(next|this) week\b/i.test(phrase) && !/\bend of (the )?(next|this) week\b/i.test(phrase)) {
    return null;
  }
  return phrase;
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
    // Speaker names aren't words anyone said: a quote running from the
    // customer's request into the consultant's reply is matched without them.
    const spoken =
      source.kind === "call" ? turnsOf(source.text).map((t) => t.text).join("\n") : source.text;
    if (!quoteInSource(item.quote, spoken)) {
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
      // A real RevOptics commitment made for the team - "on our side, we'll
      // build the dashboard" - is nobody's in particular. Held for review,
      // never put on whoever happened to say or send it.
      out.unidentified.push({ item, reason: "a RevOptics commitment with no individual owner" });
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
    const support = quoteSupports(item.quote, id, nameOf.get(id) ?? owner, source, index);
    if (!support.ours) {
      out.rejected.push({ item, reason: "nobody at RevOptics said it" });
      continue;
    }
    if (!support.owner) {
      out.unidentified.push({
        item,
        reason: `the quote doesn't show ${owner} taking it on`,
      });
      continue;
    }
    out.owned.push({ ...item, ownerId: id, when: promisedWhen(item.when, item.quote) });
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
  if (!phrase || VAGUE_WHEN.test(phrase)) return null;
  if (/\b(next|this) week\b/i.test(phrase) && !/\bend of (the )?(next|this) week\b/i.test(phrase)) {
    return null;
  }
  return parseWhen(phrase, said);
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
