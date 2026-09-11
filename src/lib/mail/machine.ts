/**
 * Mail that a machine sent, which is never a piece of work.
 *
 * Calendar invitations and their accept/decline replies, out-of-office
 * autoresponders, delivery notifications. They come from client domains,
 * they're addressed to a person, and they arrive looking exactly like a
 * thread somebody owes an answer to - so the inbox fills with "Accepted:
 * PinDrop & RevOptics | Amplify Kick Off" sitting at twenty-four days
 * waiting on a reply that nobody will ever write.
 *
 * Headers first, because they're the actual protocol and they don't care
 * what language the sender's mail client is in. RFC 3834 exists precisely
 * so that automatic mail can say so. The subject patterns are a fallback
 * for senders that don't bother.
 */

export interface MachineSignals {
  subject: string;
  /** Every header on the message, name and value as received. */
  headers: { name?: string; value?: string }[];
  /** Every MIME type in the message, including nested parts. */
  mimeTypes: string[];
}

const header = (headers: MachineSignals["headers"], name: string): string =>
  (
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    ""
  ).toLowerCase();

/**
 * Subjects Google, Outlook and friends put on calendar traffic.
 *
 * Anchored at the start, because "Accepted:" begins a calendar reply while
 * "Proposal accepted: next steps" is a person writing to you. The colon
 * matters for the same reason.
 */
const CALENDAR_SUBJECT =
  /^\s*(?:re|fw|fwd)?:?\s*(invitation|accepted|declined|tentative|updated invitation|canceled event|cancelled event|canceled|cancelled|new time proposed|invitation reply)\s*:/i;

/**
 * Autoresponders, which say so in the subject when they say it anywhere.
 *
 * "Out of office" needs more care than the rest: an autoresponder says
 * "Out of office", "Out of office: Dana Reid" or "Out of the office until
 * Monday", while a person writes "Out of office coverage plan for
 * December". So that one has to end there, or be followed by punctuation
 * or a word that only a date phrase uses. A false positive here hides a
 * real email, which is worse than showing one extra row to dismiss.
 */
const AUTO_SUBJECT =
  /^\s*(?:re|fw|fwd)?:?\s*(?:(automatic reply|auto[- ]?reply|autoreply|undeliverable|delivery status notification|mail delivery (?:failed|subsystem)|returned mail)\b|(?:out of|away from) (?:the )?office\s*(?:$|[:\-–—(]|\b(?:until|till|from|through|thru|this|next|on|returning|back)\b))/i;

/**
 * Is this message machine-generated?
 *
 * Deliberately not "does it mention a meeting". A person writing "can we
 * move Tuesday's invitation" is a person, and the point of going at the
 * headers first is to keep it that way.
 */
export function isMachineMail(m: MachineSignals): boolean {
  // RFC 3834. "auto-replied" and "auto-generated" are exactly this; "no"
  // is a message explicitly declaring itself human.
  const autoSubmitted = header(m.headers, "auto-submitted");
  if (autoSubmitted && autoSubmitted !== "no") return true;

  // The de-facto headers that predate the RFC and outnumber it.
  for (const name of [
    "x-autoreply",
    "x-autorespond",
    "x-auto-response-suppress",
    "x-mailer-autoreply",
  ]) {
    if (header(m.headers, name)) return true;
  }

  const precedence = header(m.headers, "precedence");
  if (["auto_reply", "bulk", "junk", "list"].includes(precedence)) return true;

  // A calendar invitation or response carries the event itself as a part.
  // This is the signal that catches Google Calendar traffic regardless of
  // what the subject line says or which language it says it in.
  if (m.mimeTypes.some((t) => t.toLowerCase().startsWith("text/calendar"))) {
    return true;
  }
  const contentType = header(m.headers, "content-type");
  if (contentType.includes("text/calendar")) return true;
  // method=REPLY is an accept or decline; method=REQUEST is an invitation.
  if (/method=(request|reply|cancel|counter)/i.test(contentType)) return true;

  return CALENDAR_SUBJECT.test(m.subject) || AUTO_SUBJECT.test(m.subject);
}

/**
 * A thread worth keeping.
 *
 * Only where every message in it is machine mail. One calendar invitation
 * forwarded into a real conversation shouldn't take the conversation with
 * it, and a thread that started as an invite but has people talking in it
 * is a thread with people talking in it.
 */
export function isMachineThread(messages: MachineSignals[]): boolean {
  return messages.length > 0 && messages.every(isMachineMail);
}
