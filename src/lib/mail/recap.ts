/**
 * Recap emails: which sent mail is one, and which part of it is ours.
 *
 * Deciding what in a recap is RevOptics' to do is Claude's job now (see
 * readRecap in lib/ai/summarise). Line-by-line rules used to do it and
 * couldn't tell "I'll send the mapping doc" from a numbered list of the
 * client's own next steps - and on a hard-wrapped email they cut items into
 * fragments. What stays here is cheap and certain: a gate so only likely
 * recaps are sent to Claude, and the cut that keeps quoted replies and
 * signatures out of what it reads.
 */

/** Headings that introduce a list of things to do. */
const HEADING =
  /^\s*(?:\*{0,2}|#{1,4}\s*)(next steps?|action items?|actions?|follow[- ]?ups?|to ?dos?|takeaways? and next steps?|what happens next|our next steps?|agreed next steps?)\s*[:*]*\s*$/i;

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
