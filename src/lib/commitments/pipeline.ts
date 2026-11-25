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

/** A quote's sentences, each judged on its own. */
function sentencesOf(quote: string): string[] {
  return quote
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter((x) => normalText(x).length > 0);
}

/**
 * An unpunctuated quote cut into the consecutive turns it came from: the
 * longest run of its words found in one turn, then the rest from a later
 * turn, and so on. Null unless every piece - at least two words each - is
 * found, in order.
 */
function splitAtTurns(
  normalised: string,
  said: string[],
): { text: string; turn: number }[] | null {
  const words = normalised.split(" ");
  const out: { text: string; turn: number }[] = [];
  let from = 0;
  let after = -1;
  while (from < words.length) {
    let found: { end: number; turn: number } | null = null;
    for (let end = words.length; end - from >= 2 && !found; end -= 1) {
      const piece = ` ${words.slice(from, end).join(" ")} `;
      const turn = said.findIndex((t, i) => i > after && t.includes(piece));
      if (turn !== -1) found = { end, turn };
    }
    if (!found) return null;
    out.push({ text: words.slice(from, found.end).join(" "), turn: found.turn });
    after = found.turn;
    from = found.end;
  }
  return out.length > 1 ? out : null;
}

/** One sentence of a quote, and the transcript turn it was said in. */
interface Located {
  sentence: string;
  turn: number;
}

/**
 * Where each sentence of a quote was said.
 *
 * Pinned sentence by sentence, not by shared phrases: "I'll send you the" is
 * said by everyone, and matching on runs like that once credited Priya's
 * promise to Sam because Sam had said "I'll send you the notes" earlier. A
 * sentence is placed in the turn that holds it whole (or, failing that,
 * nearly all of it); the longest sentence said in exactly one turn is the
 * anchor, and a sentence said in more than one turn - "Sounds good, will
 * do" - is placed in the turn nearest the anchor, after it if it's a tie,
 * because a reply follows what it answers. A quote that can't be anchored
 * isn't placed at all, and so shows nobody taking anything on.
 */
function locate(quote: string, turns: Turn[]): Located[] {
  const said = turns.map((t) => ` ${normalText(t.text)} `);
  const options = sentencesOf(quote).flatMap((sentence) => {
    const n = normalText(sentence);
    let where = said.flatMap((t, i) => (t.includes(` ${n} `) ? [i] : []));
    if (where.length === 0) {
      const words = n.split(" ");
      const span = Math.min(3, words.length);
      const runs: string[] = [];
      for (let i = 0; i + span <= words.length; i += 1) runs.push(words.slice(i, i + span).join(" "));
      const hits = said.map((t) => runs.filter((r) => t.includes(` ${r} `)).length);
      const best = Math.max(0, ...hits);
      if (runs.length > 0 && best / runs.length >= 0.6 && hits.filter((h) => h === best).length === 1) {
        where = [hits.indexOf(best)];
      }
    }
    if (where.length === 0) {
      // Zoom doesn't always punctuate, so a request and its answer can
      // arrive as one long "sentence". Split it where the speaker changes.
      const pieces = splitAtTurns(n, said);
      if (pieces) return pieces.map((p) => ({ sentence: p.text, where: [p.turn], words: p.text.split(" ").length }));
    }
    return [{ sentence, where, words: n.split(" ").length }];
  });

  const anchor = options
    .filter((o) => o.where.length === 1)
    .sort((x, y) => y.words - x.words)[0];
  if (!anchor) return [];
  const at = anchor.where[0];

  return options.flatMap((o) => {
    const near = o.where
      .filter((i) => Math.abs(i - at) <= 4)
      .sort((x, y) => Math.abs(x - at) - Math.abs(y - at) || y - x);
    return near.length > 0 ? [{ sentence: o.sentence, turn: near[0] }] : [];
  });
}

/** Words a whole title or sentence doesn't end on. */
const DANGLING = new Set([
  "a", "an", "the", "to", "of", "and", "or", "but", "whether", "for", "with",
  "on", "in", "at", "by", "from", "that", "if", "so", "as", "into", "about",
]);

/**
 * A cut-off piece of a sentence rather than the whole thing.
 *
 * Text that ends a sentence properly - "I can take care of that." - is
 * whole, whatever its last word. Without the full stop, ending on "a",
 * "whether" or "to" means it was cut off mid-thought.
 */
export function looksLikeFragment(text: string): boolean {
  if (/[.!?]["'’”)]*\s*$/.test(text.trim())) return false;
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

/**
 * Words that take something on, in the speaker's own voice: "I'll...",
 * "I'm going to...", "I can take care of that", "leave it with me", "will
 * do". Not "I" on its own - "I spoke with Ethan, and his team will configure
 * the field" is the sender describing the customer's work, not committing to
 * any.
 */
const TAKES_IT_ON =
  /\b(i'?ll|i will|i'?m going to|i am going to|i'?m gonna|i can (take|handle|do|own|get|send|share|look|set|build|put|run|grab|sort|pick|work|follow|reach|update|fix|configure|draft|schedule|book)|i'?m on it|i'?ll own|i own|i'?m taking|i'?m handling|let me (take|handle|get|send|own|grab|sort)|leave it with me|i'?ve got (it|this|that)|will do|on it)\b/;

/** A short yes that only commits in answer to a request. */
const AGREES = /^(sure|yes|yep|yeah|absolutely|of course|definitely|no problem|happy to|sounds good|ok|okay|will do)\b/;

/** Turning it down. */
const DECLINES =
  /\b(can'?t|cannot|won'?t|will not|unable|not able|not going to|don'?t think (i|we) can|no bandwidth|not something (i|we) can)\b/;

/** Only finding out, with nothing promised back: "I'll see whether that's possible". */
const ONLY_EXPLORING =
  /\b(see (whether|if)|check (whether|if) (it'?s|that'?s|this is|it is|that is) possible|think about|consider|look at whether)\b/;

/** ...unless the result is promised back to the customer. */
const REPORTS_BACK =
  /\b(let (you|them|him|her) know|get back to|come back to|report back|share (my |the )?(findings|results|answer)|send (you )?(my |the )?(findings|results|answer)|follow up with)\b/;

/** Clauses of one sentence: "I can't today, but I'll send it Friday" is two. */
function clausesOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .split(/[;,]\s*but\s+|\s+but\s+|;\s*/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Does this part commit to doing something, rather than decline or wonder? */
function commits(part: string, answersRequest: boolean, ownerName: string | null): boolean {
  return clausesOf(part).some((c) => {
    if (DECLINES.test(c)) return false;
    if (ONLY_EXPLORING.test(c) && !REPORTS_BACK.test(c)) return false;
    if (TAKES_IT_ON.test(c)) return true;
    if (ownerName && namedAsDoer(ownerName, c)) return true;
    return answersRequest && AGREES.test(c);
  });
}

/**
 * Does the quote show this person taking the work on - and is it a
 * commitment at all?
 *
 * Being named, or being on the call, isn't ownership. On a call the owner's
 * part of the quote is what they said themselves, plus anything a RevOptics
 * colleague said naming them as the one doing it ("Sam will..."); a customer
 * saying "Sam will sort it" doesn't count, and "I'll ask Sam about it" isn't
 * Sam's. In an email it's the sender's own commitments ("I'll..."), or the
 * colleague the sender names as doing it.
 *
 * Then that part has to commit: "I'll send it tomorrow", "I can take care of
 * that", or "Sure" in answer to a request - not "I can't take care of
 * that", not "I already sent it", not "I'll see whether that's possible"
 * unless the answer is promised back.
 *
 * "ours" when a RevOptics person said or wrote any of the quote, so a quote
 * that's entirely the customer's can be told apart from one that names the
 * wrong one of us. "said" is the owner's part, which is where a promised
 * deadline has to be.
 */
export function quoteSupports(
  quote: string,
  ownerId: string,
  ownerName: string,
  source: SourceEvidence,
  index: NameIndex,
): { owner: boolean; ours: boolean; commits: boolean; said: string } {
  if (source.kind === "email") {
    const theirs = sentencesOf(quote).filter((s) => {
      const c = s.toLowerCase().replace(/[’‘]/g, "'");
      return (ownerId === source.senderId && TAKES_IT_ON.test(c)) || namedAsDoer(ownerName, s);
    });
    const said = theirs.join(" ");
    return {
      owner: theirs.length > 0,
      ours: true,
      commits: theirs.length > 0 && commits(said, false, ownerName),
      said,
    };
  }

  const turns = turnsOf(source.text);
  const placed = locate(quote, turns);
  let ours = false;
  const theirs: Located[] = [];
  for (const p of placed) {
    const id = index.match(turns[p.turn].speaker);
    if (!id) continue;
    ours = true;
    if (id === ownerId || namedAsDoer(ownerName, p.sentence)) theirs.push(p);
  }
  const said = theirs.map((p) => p.sentence).join(" ");
  // "Sure" commits only in answer to a request - a question asked, before
  // it, in somebody else's turn.
  const first = theirs[0]?.turn ?? -1;
  const answersRequest = placed.some((p) => p.turn < first && /\?\s*$/.test(p.sentence));
  return {
    owner: theirs.length > 0,
    ours,
    commits: theirs.length > 0 && commits(said, answersRequest, ownerName),
    said,
  };
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
    if (!support.commits) {
      out.rejected.push({ item, reason: "declined, already done, or not a commitment" });
      continue;
    }
    // A deadline counts only if it's in the owner's own words - not the
    // customer's half of the quote, not another person's sentence.
    out.owned.push({ ...item, ownerId: id, when: promisedWhen(item.when, support.said) });
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
