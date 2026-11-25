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
 * How a commitment is recognised in the owner's own words.
 *
 * Not by a list of approved phrasings. Claude reads the conversation and
 * decides that something was taken on; on a call the transcript says who
 * said it. What's checked here is the opposite: whether the owner's words
 * plainly show it *wasn't* a commitment - turned down, only being looked
 * into, already done, somebody else's work, or just a question. So "That's
 * on me", "Leave that with me" and "Consider it done" are accepted the same
 * as "I'll send it", and "I can't take that on" is not.
 *
 * A bare yes - "Sure", "Absolutely", "Consider it done" - commits only in
 * answer to a request, because on its own it says what was agreed to.
 */

/** Turning it down. */
const DECLINES =
  /\b(can'?t|cannot|won'?t|will not|unable|not able|not going to|don'?t think (i|we) can|no bandwidth|not something (i|we) can)\b/;

/** Only finding out, with nothing promised back: "I'll see whether that's possible". */
const ONLY_EXPLORING =
  /\b(see (whether|if)|check (whether|if) (it'?s|that'?s|this is|it is|that is) possible|think about|consider (whether|if|doing)|look at whether)\b/;

/**
 * A commitment with a hedge on it: "I'll try to get it to you by Friday".
 * Still a commitment - but the timing isn't promised, so no date is.
 */
const HEDGED = /\b(try to|try and|might|maybe|hopefully|not sure|should be able|aim to|if (i|we) can)\b/;

/** ...unless the result is promised back to the customer. */
const REPORTS_BACK =
  /\b(let (you|them|him|her) know|get back to|come back to|report back|share (my |the )?(findings|results|answer)|send (you )?(my |the )?(findings|results|answer)|follow up with)\b/;

/** Something said about the future: what makes "already sent" not the whole story. */
const AHEAD =
  /\b(i'?ll|i will|will|going to|gonna|i can|let me|on it|on me|with me|i'?ve got|consider it done)\b/;

/** Work reported as done, with nothing still to do. */
const ALREADY_DONE =
  /\b(already|i'?ve (sent|done|shared|completed|updated|fixed|built|finished|set up|configured)|i (sent|did|shared|completed|updated|fixed|built|finished|spoke|talked|mentioned|confirmed|met|discussed|reviewed|checked))\b/;

/** Somebody else doing it: "his team will configure the field". */
const SOMEONE_ELSE =
  /\b(you|your team|your side|they|their team|his team|her team|he|she|the customer|the client)( will|'ll| are going to| is going to| can| should| need to)\b/;

/** The speaker - or writer - talking about themselves. */
const SELF = /\b(i|i'?ll|i'?m|i'?ve|i'?d|me|my|mine)\b/;

/**
 * Something that actually takes work on - looking ahead, or claiming it.
 *
 * Grammar, not a phrasebook: any "I'll...", "I'm going to...", "let me...",
 * "I can <do something>", "<name> will...", or a claim of ownership ("on
 * me", "with me", "I've got it", "mine"). Without one, a sentence describes
 * or agrees - "I think the configuration looks correct", "I have access to
 * the dashboard", "I understand the issue" - and commits to nothing.
 */
const TAKES_ON =
  /\b(i'?ll|i will|i shall|i'?m going to|i am going to|i'?m gonna|going to|gonna|will|let me|i can (?!see|hear|tell|imagine|understand|appreciate|access|agree|relate|picture|confirm that)[a-z]+|i'?m on it|on it|on me|with me|i'?ve got (it|this|that|you)|i got (it|this|that)|consider it done|you got it|mine|count me in|i'?m taking|i'?m handling)\b/;

/** Just a yes. */
const ONLY_AGREES =
  /^(sure|yes|yep|yeah|absolutely|of course|definitely|no problem|happy to|sounds good|ok|okay|will do|you got it|consider it done|done|on it|perfect|great)\b[\s,.!]*(thanks|thank you|will do|on it)?[\s.!]*$/;

/** Clauses of one sentence: "I can't today, but I'll send it Friday" is two. */
function clausesOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .split(/[;,]\s*but\s+|\s+but\s+|;\s*|,\s*and\s+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/** One of the owner's sentences, and whether it directly answers a request. */
interface Said {
  text: string;
  /** The turn just before it is somebody else asking for something. */
  answersRequest: boolean;
}

/**
 * Does any of this commit, rather than decline, wonder, report, ask, or just
 * describe?
 *
 * Each clause needs positive evidence (TAKES_ON, or the owner named as the
 * one doing it) and none of the signs against. A bare "Sure" / "Sounds good"
 * counts only when it's the direct answer to a request - not to something
 * asked three turns earlier and already dealt with.
 *
 * `aboutSelf` is for email, where there's no speaker label: the clause has to
 * be the writer talking about themselves, or naming the colleague who'll do
 * it. On a call the speaker label has already established that.
 */
function commitsIn(part: Said, ownerName: string | null, aboutSelf: boolean): boolean {
  if (/\?\s*$/.test(part.text)) return false;
  return clausesOf(part.text).some((c) => {
    if (DECLINES.test(c)) return false;
    if (ONLY_EXPLORING.test(c) && !REPORTS_BACK.test(c)) return false;
    if (ALREADY_DONE.test(c) && !AHEAD.test(c.replace(/\balready\b.*$/, ""))) return false;
    if (SOMEONE_ELSE.test(c) && !/\bi('ll| will| can|'m going to)\b/.test(c)) return false;
    const named = ownerName !== null && namedAsDoer(ownerName, c);
    if (aboutSelf && !named && !SELF.test(c)) return false;
    if (ONLY_AGREES.test(c)) return part.answersRequest;
    return named || TAKES_ON.test(c);
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
 * Sam's. In an email it's the sender writing about themselves, or the
 * colleague the sender names as doing it.
 *
 * Then that part has to commit - see `commits` above.
 *
 * "ours" when a RevOptics person said or wrote any of the quote, so a quote
 * that's entirely the customer's can be told apart from one that names the
 * wrong one of us. "said" is the owner's part. "asked" is the request their
 * answer accepted, when it was a plain yes rather than a "let me see" - a
 * deadline in it ("by Friday?" - "Absolutely") was agreed to.
 */
export function quoteSupports(
  quote: string,
  ownerId: string,
  ownerName: string,
  source: SourceEvidence,
  index: NameIndex,
): { owner: boolean; ours: boolean; commits: boolean; said: string; asked: string } {
  if (source.kind === "email") {
    const theirs = sentencesOf(quote).filter((s) => {
      const c = s.toLowerCase().replace(/[’‘]/g, "'");
      return (ownerId === source.senderId && SELF.test(c)) || namedAsDoer(ownerName, s);
    });
    return {
      owner: theirs.length > 0,
      ours: true,
      commits: theirs.some((t) => commitsIn({ text: t, answersRequest: false }, ownerName, true)),
      said: theirs.join(" "),
      asked: "",
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
  // What's being answered: a request in the turn directly before, from
  // somebody else. Further back, it's been answered already or moved on from.
  const isRequest = (p: Located) =>
    index.match(turns[p.turn].speaker) !== ownerId &&
    (/\?\s*$/.test(p.sentence) || /\b(can|could|would|will) you\b/i.test(p.sentence));
  const requestBefore = (turn: number) =>
    placed.filter((q) => q.turn === turn - 1 && isRequest(q));

  const committing = theirs.filter((p) =>
    commitsIn({ text: p.sentence, answersRequest: requestBefore(p.turn).length > 0 }, ownerName, false),
  );
  const asked = [...new Set(committing.flatMap((p) => requestBefore(p.turn)).map((q) => q.sentence))];
  return {
    owner: theirs.length > 0,
    ours,
    commits: committing.length > 0,
    said: theirs.map((p) => p.sentence).join(" "),
    asked: asked.join(" "),
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

/** Words that say when, as opposed to what. */
const TIMING =
  /\b(today|tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|eod|eow|end of|by the|next week|this week|weekend|month|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}(st|nd|rd|th)?)\b/;

/** Verbs and filler every title shares, so they say nothing about which deliverable. */
const GENERIC =
  /^(send|share|get|give|provide|deliver|update|updated|draft|create|build|prepare|put|together|over|set|run|review|follow|confirm|schedule|book|new|revised|final|their|team)$/;

function deliverableWords(text: string): Set<string> {
  return new Set(
    normalText(text)
      .split(" ")
      .filter((w) => w.length > 2 && !GENERIC.test(w) && !DANGLING.has(w))
      .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w)),
  );
}

/**
 * The promised deadline for one item, or none.
 *
 * Whose words it can come from:
 *  - the owner's own - "I'll send it by Friday";
 *  - or the request they plainly accepted - "Can you send it by Friday?"
 *    "Absolutely" - as long as they didn't name a time of their own.
 * Not when the acceptance was hedged ("I'll try to..."): a commitment, but
 * not to that date.
 *
 * And when one sentence carries two deliverables with two dates - "the
 * sequences tomorrow and the recommendations by Friday" - the date has to
 * sit with this item's deliverable, not the other one.
 */
function agreedWhen(
  item: Candidate,
  support: { said: string; asked: string },
): string | null {
  const said = support.said.toLowerCase().replace(/[’‘]/g, "'");
  if (HEDGED.test(said)) return null;

  const own = promisedWhen(item.when, support.said);
  if (own) {
    // Only parts that commit count: "I can't do it today, but I'll send it
    // tomorrow" has one date that's promised and one that isn't.
    const parts = said
      .split(/,?\s+and\s+|;\s*|,\s+|\s+but\s+/)
      .filter((p) => TIMING.test(p) && !DECLINES.test(p));
    if (parts.length < 2) return own;
    // Several dates in the owner's words: this one must share a deliverable
    // word with the item's title.
    const phrase = normalText(own);
    const part = parts.find((p) => ` ${normalText(p)} `.includes(` ${phrase} `));
    const theirs = deliverableWords(item.title);
    const near = part ? [...deliverableWords(part)].some((w) => theirs.has(w)) : false;
    return near ? own : null;
  }

  if (support.asked && !TIMING.test(said)) return promisedWhen(item.when, support.asked);
  return null;
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
    out.owned.push({ ...item, ownerId: id, when: agreedWhen(item, support) });
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
