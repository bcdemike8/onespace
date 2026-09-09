import "server-only";

// Thin Slack Web API client. Deliberately not the official SDK: we call six
// methods, and a dependency that ships its own retry, logging and websocket
// stack is more surface than this needs.
//
// The bot token lives in SLACK_BOT_TOKEN and never leaves the server.

const API = "https://slack.com/api/";

export const slackConfigured = () => Boolean(process.env.SLACK_BOT_TOKEN);

export interface SlackResult<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

/**
 * Form-encode arguments. Slack's Web API is inconsistent about JSON bodies —
 * chat.postMessage accepts them, users.lookupByEmail and conversations.list do
 * not, and the ones that don't reply `invalid_arguments` as though you'd sent
 * nothing at all. Form encoding is the one shape every method accepts, so
 * everything goes out that way and nested values (blocks) travel as JSON
 * strings, which is exactly what Slack expects there.
 */
function encode(body: Record<string, unknown>): string {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    form.set(
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value),
    );
  }
  return form.toString();
}

async function call<T>(
  method: string,
  body: Record<string, unknown>,
): Promise<SlackResult<T>> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "Slack isn't connected yet." };

  let res: Response;
  try {
    res = await fetch(API + method, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      body: encode(body),
    });
  } catch {
    // A digest run shouldn't die because Slack had a bad minute.
    return { ok: false, error: "Couldn't reach Slack." };
  }

  const json = (await res.json().catch(() => null)) as
    | ({ ok: boolean; error?: string } & Record<string, unknown>)
    | null;

  if (!json) return { ok: false, error: "Slack sent back something unreadable." };
  if (!json.ok) return { ok: false, error: json.error ?? "unknown_error" };
  return { ok: true, data: json as T };
}

/** Post a message. `channel` may be a channel id or a user id for a DM. */
export function postMessage(channel: string, text: string, blocks?: unknown[]) {
  return call<{ ts: string }>("chat.postMessage", {
    channel,
    text, // always sent: it's the notification preview and the a11y fallback
    ...(blocks ? { blocks } : {}),
    unfurl_links: false,
    unfurl_media: false,
  });
}

export interface EmailLookup {
  id: string | null;
  /** Set only when Slack refused the question, never when the answer is "no". */
  error?: string;
}

/**
 * Find a Slack member by email.
 *
 * "Not in the workspace" and "the app isn't allowed to ask" are different
 * answers and used to collapse into the same null. They don't any more: a
 * missing scope looks identical to seven people not existing, which is a
 * miserable thing to debug.
 */
export async function lookupByEmail(email: string): Promise<EmailLookup> {
  const r = await call<{ user: { id: string } }>("users.lookupByEmail", { email });
  if (r.ok && r.data) return { id: r.data.user.id };
  if (r.error === "users_not_found") return { id: null };
  return { id: null, error: r.error ?? "unknown_error" };
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
}

/**
 * Channels the bot can see. A bot only sees a private channel it has been
 * invited to, which is worth surfacing rather than silently omitting.
 */
export async function listChannels(): Promise<SlackChannel[]> {
  const out: SlackChannel[] = [];
  let cursor: string | undefined;

  // Bounded: 10 pages of 200 is far more channels than anyone maps to projects,
  // and an unbounded loop on a paginated API is how you hit a rate limit.
  for (let page = 0; page < 10; page++) {
    const r = await call<{
      channels: SlackChannel[];
      response_metadata?: { next_cursor?: string };
    }>("conversations.list", {
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 200,
      ...(cursor ? { cursor } : {}),
    });
    if (!r.ok || !r.data) break;
    out.push(...r.data.channels);
    cursor = r.data.response_metadata?.next_cursor || undefined;
    if (!cursor) break;
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function authTest(): Promise<
  SlackResult<{ team: string; user: string; bot_id: string }>
> {
  return call("auth.test", {});
}
