import { NOT_A_PROMISE, toTaskTitle } from "@/lib/zoom/commitments";

/**
 * Action items out of a recap email.
 *
 * The other half of what the call produced. A consultant comes off a call,
 * writes "Next steps: 1. I'll send the sequence spec, 2. Yaz to set up the
 * sandbox", and that list is the most considered statement of what was
 * agreed that exists anywhere - better than the transcript, because they
 * thought about it afterwards.
 *
 * Different shape from speech, so different rules. A recap is written, so
 * there is no filler to strip and no speaker labels; but it has structure a
 * transcript doesn't - a heading, then a list - and that structure is the
 * strongest signal there is. A line under "Next steps" is an action item
 * because of where it sits, not because of how it is phrased.
 *
 * Same bar as the transcript rules: precision. Only ours, only real
 * undertakings, and a quoted reply is somebody else's mail.
 */

export interface RecapItem {
  /** The line as written. */
  text: string;
  suggestedTask: string;
  /** Named in the line itself - "Yaz to send the spec" - when it isn't us. */
  owner: string | null;
}

/** Headings that introduce a list of things to do. */
const HEADING =
  /^\s*(?:\*{0,2}|#{1,4}\s*)(next steps?|action items?|actions?|follow[- ]?ups?|to ?dos?|takeaways? and next steps?|what happens next|our next steps?|agreed next steps?)\s*[:*]*\s*$/i;

/** A heading that ends the actionable list - anything after is not ours. */
const CLOSING_HEADING =
  /^\s*(?:\*{0,2}|#{1,4}\s*)(notes?|summary|recap|background|context|discussion|attendees?|agenda|questions?|f\.?y\.?i\.?|resources?|links?|thanks|regards|best|cheers)\b/i;

/** A list line: bullet, number, or letter. */
const BULLET = /^\s*(?:[-*•‣◦]|\d{1,2}[.)]|[a-z][.)])\s+/i;

/** Where the original message starts in a reply. Everything below is theirs. */
const QUOTED = [
  /^\s*>/,
  /^\s*On .{5,80}\bwrote:\s*$/i,
  /^\s*-{2,}\s*Original Message\s*-{2,}/i,
  /^\s*From:\s*\S+@\S+/i,
  /^\s*_{5,}\s*$/,
];

/** A signature block. Job titles and phone numbers are not action items. */
const SIGNATURE = [
  /^\s*--\s*$/,
  /^\s*(?:best|thanks|thank you|regards|kind regards|best regards|cheers|talk soon|speak soon|warmly)[,!.]*\s*$/i,
  /^\s*sent from my \w+/i,
];

/**
 * "Yaz to set up the sandbox", "Marcus will draft the playbook".
 *
 * A recap assigns work by name far more often than a conversation does,
 * because it's written for people who weren't all on the call.
 */
const OWNED =
  /^\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:to|will|is going to|has agreed to|owns)\s+(.+)$/;

/** First person plural or singular - ours to do. */
const OURS =
  /\b(?:i(?:'|’)?ll|i will|we(?:'|’)?ll|we will|i(?:'|’)?m going to|we(?:'|’)?re going to|i am going to|we are going to|revoptics (?:to|will)|our team will|i(?:'|’)?ll be)\b/i;

/** Not a task however it reads. */
const NOT_AN_ITEM = [
  /^\s*$/,
  // A bare link, or a line that is only a link and a label.
  /^\s*(?:https?:\/\/|www\.)\S+\s*$/i,
  // Calendar furniture pasted into the body.
  /^\s*(?:when|where|who|join zoom meeting|meeting id|passcode|dial[- ]in)\s*[:.]/i,
  // Questions belong in a reply, not a task list.
  /\?\s*$/,
];

/** Sentence boundaries in written prose. */
const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z"'(])/;

const clean = (line: string): string =>
  line.replace(BULLET, "").replace(/\s+/g, " ").trim();

/**
 * The body, cut at the first quoted reply or signature.
 *
 * Recaps get replied to, and the reply quotes the whole thing. Reading the
 * quote would raise the same action items a second time every time somebody
 * says "thanks".
 */
export function ownWords(body: string): string[] {
  const out: string[] = [];
  for (const line of body.split(/\r?\n/)) {
    if (QUOTED.some((r) => r.test(line))) break;
    if (SIGNATURE.some((r) => r.test(line))) break;
    out.push(line);
  }
  return out;
}

/**
 * Action items in a recap email we sent.
 *
 * Two ways in, and a line only needs one: it sits in a list under a
 * next-steps heading, or it is phrased as an undertaking anywhere in the
 * body. The heading path is the reliable one; the phrasing path catches the
 * recap written as prose.
 */
export function extractRecapItems(body: string): RecapItem[] {
  const lines = ownWords(body);
  const out: RecapItem[] = [];
  const seen = new Set<string>();

  let inList = false;

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");

    if (HEADING.test(line)) {
      inList = true;
      continue;
    }
    // A closing heading ends the list. So does a blank line followed by
    // prose, but a blank line inside a list is just spacing - so only an
    // actual heading closes it.
    if (inList && CLOSING_HEADING.test(line)) {
      inList = false;
      continue;
    }

    const bulleted = BULLET.test(line);
    const whole = clean(line);
    if (whole.length < 6) continue;

    // A bullet is one item however long. A paragraph is one item per
    // sentence: "I'll put together the mapping doc. We'll also confirm
    // sandbox access." is two pieces of work, and keeping them together
    // makes a task nobody can tick.
    const pieces = bulleted ? [whole] : whole.split(SENTENCE_SPLIT);

    for (const piece of pieces) {
      const text = piece.trim();
      if (text.length < 6 || text.length > 300) continue;
      if (NOT_AN_ITEM.some((r) => r.test(text))) continue;
      if (NOT_A_PROMISE.some((r) => r.test(text))) continue;

      // In the list: a bullet is enough. Outside it: it has to say so itself.
      const listItem = inList && bulleted;
      const stated = OURS.test(text);
      const owned = text.match(OWNED);

      if (!listItem && !stated && !owned) continue;

      // A line under a heading that runs to prose length is a paragraph that
      // happened to follow the heading, not an action item.
      if (listItem && !stated && !owned && text.split(/\s+/).length > 30) continue;

      let owner: string | null = null;
      let action = text;

      if (owned) {
        owner = owned[1];
        action = owned[2];
        // "We to send" never happens; "We will send" is caught by OURS. A
        // capitalised first word that is actually a pronoun isn't an owner.
        if (/^(we|i|they|it|this|that|the|team|next|please)$/i.test(owner)) {
          owner = null;
          action = text;
        }
      }

      const suggestedTask = toTaskTitle(action);
      if (suggestedTask.split(/\s+/).filter(Boolean).length < 3) continue;

      const key = suggestedTask.toLowerCase().replace(/[^a-z0-9 ]/g, "");
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        text,
        suggestedTask: suggestedTask.slice(0, 200),
        owner,
      });
    }
  }

  return out;
}

/**
 * Does this look like a recap at all?
 *
 * Cheap gate before the real work. Most sent mail is not a recap, and
 * running the rules over every message we ever wrote finds action items in
 * scheduling notes and introductions where there are none.
 */
export function looksLikeRecap(subject: string, body: string): boolean {
  if (/\b(recap|notes|summary|follow[- ]?up|next steps|action items)\b/i.test(subject)) {
    return true;
  }
  // HEADING is anchored to a whole line, so it has to be tried line by line
  // rather than against the joined body.
  const lines = ownWords(body);
  return lines.some(
    (l) => HEADING.test(l) || /^\s*(?:next steps?|action items?)\s*:/i.test(l),
  );
}
