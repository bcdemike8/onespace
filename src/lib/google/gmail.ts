import "server-only";
import { googleRequest, SCOPES } from "@/lib/google/auth";

// Reading and sending client mail.
//
// Google has no scope meaning "only mail from these people", so the grant is
// the whole mailbox and the narrowing happens here: every search is built
// from the domains mapped to a client, and nothing outside them is ever
// requested, parsed or stored. That distinction matters and is worth being
// explicit about - the app *can* read everything and deliberately doesn't.

export interface MailHeaderInfo {
  fromEmail: string;
  fromName: string | null;
  toEmails: string[];
  ccEmails: string[];
  subject: string;
  sentAt: Date;
  messageId: string | null;
  references: string | null;
}

export interface GmailMessage extends MailHeaderInfo {
  gmailMessageId: string;
  threadId: string;
  body: string;
  labelIds: string[];
}

export interface GmailThread {
  gmailThreadId: string;
  messages: GmailMessage[];
}

interface RawPart {
  mimeType?: string;
  filename?: string;
  headers?: { name?: string; value?: string }[];
  body?: { data?: string; size?: number };
  parts?: RawPart[];
}

interface RawMessage {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  internalDate?: string;
  payload?: RawPart;
}

const decode = (data: string) => Buffer.from(data, "base64url").toString("utf8");

/** One address out of a header value like `Dana Scully <dana@acme.com>`. */
function parseAddress(value: string): { email: string; name: string | null } {
  const angled = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (angled) {
    const name = angled[1].replace(/^"|"$/g, "").trim();
    return { email: angled[2].trim().toLowerCase(), name: name || null };
  }
  return { email: value.trim().toLowerCase(), name: null };
}

/**
 * Split a To/Cc header into addresses.
 *
 * Commas inside a quoted display name - `"Scully, Dana" <dana@acme.com>` - are
 * not separators, which a plain split on "," gets wrong every time.
 */
function splitAddresses(value: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  let angle = false;

  for (const ch of value) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "<") angle = true;
    else if (ch === ">") angle = false;

    if (ch === "," && !quoted && !angle) {
      if (current.trim()) out.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out.map((a) => parseAddress(a).email).filter(Boolean);
}

const headerOf = (part: RawPart | undefined, name: string): string | null => {
  const found = part?.headers?.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase(),
  );
  return found?.value ?? null;
};

/**
 * Readable text from a MIME tree.
 *
 * Prefers text/plain. Falls back to stripping the HTML part, because a
 * client's arbitrary HTML rendered inside the app is an injection surface
 * that buys nothing - this is a thread to read and answer, not a newsletter.
 */
function extractBody(part: RawPart | undefined, depth = 0): string {
  if (!part || depth > 8) return "";

  // Attachments have a filename; their base64 is not text anybody wants.
  if (part.filename) return "";

  if (part.mimeType === "text/plain" && part.body?.data) {
    return decode(part.body.data);
  }

  if (part.parts?.length) {
    const plain = part.parts
      .map((p) => extractBody(p, depth + 1))
      .filter(Boolean)
      .join("\n");
    if (plain.trim()) return plain;
  }

  if (part.mimeType === "text/html" && part.body?.data) {
    return stripHtml(decode(part.body.data));
  }

  return "";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    // A blank line between blocks, not a single break: paragraphs run
    // together are the difference between a readable mail and a wall.
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Everything Gmail's raw message shape gives us, in our own terms. */
export function toMessage(raw: RawMessage): GmailMessage | null {
  if (!raw.id || !raw.threadId) return null;

  const from = headerOf(raw.payload, "From");
  const parsed = from ? parseAddress(from) : { email: "", name: null };
  const dateHeader = headerOf(raw.payload, "Date");
  const sentAt = raw.internalDate
    ? new Date(Number(raw.internalDate))
    : dateHeader
      ? new Date(dateHeader)
      : new Date();

  return {
    gmailMessageId: raw.id,
    threadId: raw.threadId,
    fromEmail: parsed.email,
    fromName: parsed.name,
    toEmails: splitAddresses(headerOf(raw.payload, "To") ?? ""),
    ccEmails: splitAddresses(headerOf(raw.payload, "Cc") ?? ""),
    subject: headerOf(raw.payload, "Subject")?.trim() || "(no subject)",
    sentAt: Number.isNaN(sentAt.getTime()) ? new Date() : sentAt,
    messageId: headerOf(raw.payload, "Message-ID"),
    references: headerOf(raw.payload, "References"),
    body: extractBody(raw.payload).trim(),
    labelIds: raw.labelIds ?? [],
  };
}

/**
 * A Gmail search covering mail either way with any of these domains.
 *
 * Chunked by the caller: seventy domains in one `q` makes a URL Gmail rejects,
 * and a rejected search looks exactly like a client who never wrote.
 */
export function buildQuery(domains: string[], after: Date): string {
  const clause = domains.map((d) => `from:${d} OR to:${d} OR cc:${d}`).join(" OR ");
  const y = after.getUTCFullYear();
  const m = String(after.getUTCMonth() + 1).padStart(2, "0");
  const d = String(after.getUTCDate()).padStart(2, "0");
  // -in:chats keeps Google Chat history out; it is not email and has no body.
  return `(${clause}) after:${y}/${m}/${d} -in:chats -in:drafts`;
}

/** Thread ids matching a search, newest first, capped. */
export async function findThreadIds(
  userEmail: string,
  domains: string[],
  after: Date,
  limit = 150,
): Promise<string[]> {
  const ids = new Set<string>();

  // 20 domains per query keeps the URL comfortably short. Gmail counts each
  // OR term, and a query that is too long comes back as a 400, not as
  // "no results", so it would otherwise fail loudly at the worst moment.
  for (let i = 0; i < domains.length; i += 20) {
    const chunk = domains.slice(i, i + 20);
    if (chunk.length === 0) continue;

    let pageToken: string | undefined;
    for (let page = 0; page < 5 && ids.size < limit; page++) {
      const data = await googleRequest<{
        threads?: { id?: string }[];
        nextPageToken?: string;
      }>({
        subject: userEmail,
        scopes: [SCOPES.gmailRead],
        url: "/gmail/v1/users/me/threads",
        query: {
          q: buildQuery(chunk, after),
          maxResults: 100,
          pageToken,
        },
      });

      for (const t of data.threads ?? []) {
        if (t.id) ids.add(t.id);
      }
      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }
  }

  return [...ids].slice(0, limit);
}

export async function getThread(
  userEmail: string,
  threadId: string,
): Promise<GmailThread | null> {
  const data = await googleRequest<{ id?: string; messages?: RawMessage[] }>({
    subject: userEmail,
    scopes: [SCOPES.gmailRead],
    url: `/gmail/v1/users/me/threads/${encodeURIComponent(threadId)}`,
    query: { format: "full" },
  });

  const messages = (data.messages ?? [])
    .map(toMessage)
    .filter((m): m is GmailMessage => m !== null)
    .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());

  if (messages.length === 0) return null;
  return { gmailThreadId: data.id ?? threadId, messages };
}

// ------------------------------------------------------------------ sending

/** RFC 2047 for a display name, so accented names don't arrive as mojibake. */
function encodeWord(text: string): string {
  // eslint-disable-next-line no-control-regex
  return /^[\x20-\x7E]*$/.test(text)
    ? text
    : `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

/** A header value can't carry a newline: that would be header injection. */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

export interface ReplyInput {
  from: { email: string; name: string };
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  /** Gmail thread to attach to, so it lands in the same conversation. */
  threadId: string;
  /** The Message-ID being answered, for proper threading in their client. */
  inReplyTo: string | null;
  references: string | null;
}

/**
 * Send a reply as the signed-in person.
 *
 * Built by hand rather than with a MIME library: this is one plain-text part
 * with six headers, and every value that comes from user input is stripped of
 * newlines first.
 */
export async function sendReply(input: ReplyInput): Promise<string> {
  const subject = oneLine(input.subject);
  const headers = [
    `From: ${encodeWord(oneLine(input.from.name))} <${oneLine(input.from.email)}>`,
    `To: ${input.to.map(oneLine).join(", ")}`,
    ...(input.cc && input.cc.length > 0 ? [`Cc: ${input.cc.map(oneLine).join(", ")}`] : []),
    `Subject: ${encodeWord(subject.startsWith("Re:") ? subject : `Re: ${subject}`)}`,
    ...(input.inReplyTo ? [`In-Reply-To: ${oneLine(input.inReplyTo)}`] : []),
    ...(input.references || input.inReplyTo
      ? [`References: ${oneLine([input.references, input.inReplyTo].filter(Boolean).join(" "))}`]
      : []),
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
  ];

  const raw = Buffer.from(`${headers.join("\r\n")}\r\n\r\n${input.body}`, "utf8")
    .toString("base64url");

  const sent = await googleRequest<{ id?: string }>({
    subject: input.from.email,
    scopes: [SCOPES.gmailSend],
    url: "/gmail/v1/users/me/messages/send",
    method: "POST",
    body: { raw, threadId: input.threadId },
  });

  return sent.id ?? "";
}
