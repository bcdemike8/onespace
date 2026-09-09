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
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
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

/** Find a Slack member by email. Returns null when they simply aren't there. */
export async function lookupByEmail(email: string): Promise<string | null> {
  const r = await call<{ user: { id: string } }>("users.lookupByEmail", { email });
  return r.ok && r.data ? r.data.user.id : null;
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
