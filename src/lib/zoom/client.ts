import "server-only";

// Zoom, via a Server-to-Server OAuth app.
//
// Same shape as the Google connection and for the same reason: one credential
// held by the account, no per-person consent screen, nobody able to silently
// revoke it. Zoom mints a token from an account id and a client id/secret
// pair; there is no user leg at all.
//
// No SDK. This is five REST calls and a token exchange.

const TOKEN_URL = "https://zoom.us/oauth/token";
const API = "https://api.zoom.us/v2";

export const zoomConfigured = () =>
  Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
      process.env.ZOOM_CLIENT_ID &&
      process.env.ZOOM_CLIENT_SECRET,
  );

export class ZoomError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly code?: number,
  ) {
    super(message);
  }
}

let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (!zoomConfigured()) {
    throw new ZoomError("Zoom isn't connected yet.");
  }
  // A minute of headroom, so a token can't expire mid-request.
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const basic = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(
    `${TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(
      process.env.ZOOM_ACCOUNT_ID!,
    )}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } },
  ).catch(() => null);

  if (!res) throw new ZoomError("Couldn't reach Zoom.");

  const body = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
    reason?: string;
    error?: string;
  } | null;

  if (!res.ok || !body?.access_token) {
    throw new ZoomError(explainToken(res.status, body?.reason ?? body?.error), res.status);
  }

  cached = {
    token: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  };
  return cached.token;
}

/** Zoom's token failures, in terms of which field to go and check. */
function explainToken(status: number, reason: string | undefined): string {
  if (status === 400 && reason?.toLowerCase().includes("account")) {
    return "Zoom doesn't recognise that account id. It's the Account ID on your Server-to-Server OAuth app, not your user id.";
  }
  if (status === 401) {
    return "Zoom rejected the client id or secret. Both come from the same Server-to-Server OAuth app - check they weren't copied from different apps.";
  }
  return `Zoom refused the token${reason ? `: ${reason}` : ` (${status})`}.`;
}

/** Forget the cached token - used after the credentials change. */
export function resetZoomToken() {
  cached = null;
}

export async function zoomRequest<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const token = await accessToken();
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!res) throw new ZoomError("Couldn't reach Zoom.");

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { message?: string; code?: number }
      | null;
    throw new ZoomError(explainApi(res.status, body?.code, body?.message), res.status, body?.code);
  }

  return (await res.json()) as T;
}

/**
 * The API errors that actually happen here, each pointing at the scope or the
 * plan feature behind it rather than the status code.
 */
function explainApi(status: number, code: number | undefined, message: string | undefined): string {
  if (status === 401) {
    return "Zoom rejected the token. The Server-to-Server app may have been deactivated.";
  }
  if (status === 403 || code === 4711) {
    return `Zoom refused: ${message ?? "missing scope"}. Add the scope to the Server-to-Server OAuth app and activate it again - scopes added after activation don't take effect until you do.`;
  }
  if (status === 404 || code === 3001) {
    return "Zoom has no record of that meeting. Meetings drop out of the reports API after a while, and a call that was never started has no report at all.";
  }
  if (status === 429) {
    return "Zoom is rate-limiting. The sync backs off; try again in a minute.";
  }
  return message ?? `Zoom returned ${status}.`;
}

/**
 * Download a recording asset - the transcript, in practice.
 *
 * These URLs need the bearer token like any other call, and return the file
 * itself rather than JSON.
 */
export async function zoomDownload(downloadUrl: string): Promise<string | null> {
  const token = await accessToken();
  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return res.text();
}

// -------------------------------------------------------------- shapes

export interface ZoomUser {
  id: string;
  email: string;
}

export interface ZoomPastMeeting {
  uuid: string;
  id: number;
  topic: string;
  start_time: string;
  end_time?: string;
  duration: number;
  host_email?: string;
}

export interface ZoomRecordingFile {
  id?: string;
  file_type?: string;
  recording_type?: string;
  download_url?: string;
  play_url?: string;
}

export interface ZoomRecording {
  uuid: string;
  id: number;
  topic: string;
  start_time: string;
  duration: number;
  share_url?: string;
  recording_files?: ZoomRecordingFile[];
}

/** Everyone on the Zoom account, so their meetings can be found. */
export async function listZoomUsers(): Promise<ZoomUser[]> {
  const out: ZoomUser[] = [];
  let token: string | undefined;

  for (let page = 0; page < 10; page++) {
    const data = await zoomRequest<{
      users?: { id?: string; email?: string }[];
      next_page_token?: string;
    }>("/users", { page_size: 300, status: "active", next_page_token: token });

    for (const u of data.users ?? []) {
      if (u.id && u.email) out.push({ id: u.id, email: u.email.toLowerCase() });
    }
    token = data.next_page_token || undefined;
    if (!token) break;
  }
  return out;
}

/**
 * One person's finished meetings in a date window.
 *
 * The reports API is the only place Zoom exposes what a meeting actually did
 * rather than what it was booked for. It needs report:read:admin and a paid
 * plan; on a plan without it this 403s and the sync says so.
 */
export async function listPastMeetings(
  zoomUserId: string,
  from: Date,
  to: Date,
): Promise<ZoomPastMeeting[]> {
  const out: ZoomPastMeeting[] = [];
  const day = (d: Date) => d.toISOString().slice(0, 10);

  // Zoom caps a report query at one month, so walk the window in chunks.
  let windowStart = new Date(from);
  for (let chunk = 0; chunk < 24 && windowStart < to; chunk++) {
    const windowEnd = new Date(
      Math.min(to.getTime(), windowStart.getTime() + 29 * 86_400_000),
    );

    let token: string | undefined;
    for (let page = 0; page < 20; page++) {
      const data = await zoomRequest<{
        meetings?: ZoomPastMeeting[];
        next_page_token?: string;
      }>(`/report/users/${encodeURIComponent(zoomUserId)}/meetings`, {
        from: day(windowStart),
        to: day(windowEnd),
        page_size: 300,
        type: "past",
        next_page_token: token,
      });

      out.push(...(data.meetings ?? []));
      token = data.next_page_token || undefined;
      if (!token) break;
    }

    windowStart = new Date(windowEnd.getTime() + 86_400_000);
  }

  return out;
}

/**
 * The recording for one sitting of a meeting.
 *
 * A double-encoded UUID is required when it contains a slash or starts with
 * one - a Zoom quirk that silently 404s if you skip it.
 */
export async function getRecording(uuid: string): Promise<ZoomRecording | null> {
  const needsDoubleEncoding = uuid.startsWith("/") || uuid.includes("//");
  const id = needsDoubleEncoding
    ? encodeURIComponent(encodeURIComponent(uuid))
    : encodeURIComponent(uuid);

  try {
    return await zoomRequest<ZoomRecording>(`/meetings/${id}/recordings`);
  } catch (e) {
    // No recording is the normal case, not a failure.
    if (e instanceof ZoomError && (e.status === 404 || e.code === 3301)) return null;
    throw e;
  }
}

export interface ZoomSummary {
  summary_overview?: string;
  summary_details?: { label?: string; summary?: string }[];
  next_steps?: string[];
}

/** Zoom's own AI Companion summary, when the plan includes it. */
export async function getMeetingSummary(uuid: string): Promise<ZoomSummary | null> {
  const needsDoubleEncoding = uuid.startsWith("/") || uuid.includes("//");
  const id = needsDoubleEncoding
    ? encodeURIComponent(encodeURIComponent(uuid))
    : encodeURIComponent(uuid);

  try {
    return await zoomRequest<ZoomSummary>(`/meetings/${id}/meeting_summary`);
  } catch (e) {
    // 404 is the ordinary case: this call has no summary. Swallow it.
    //
    // 400 and 403 are not ordinary and used to be swallowed with it, which
    // meant a missing scope or a plan without AI Companion came back
    // indistinguishable from "no summary on this one" - and the sync then
    // told people to go and switch AI Companion on, which for a scope
    // problem is the wrong advice entirely. They are rethrown so the caller
    // can report what Zoom actually said.
    if (e instanceof ZoomError && e.status === 404) return null;
    throw e;
  }
}
