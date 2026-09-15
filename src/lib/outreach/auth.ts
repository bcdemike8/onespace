import "server-only";
import { db } from "@/lib/db";
import { OutreachError } from "@/lib/outreach/errors";
import { signAppToken } from "@/lib/outreach/jwt";

/**
 * Outreach, over their server-to-server protocol.
 *
 * Not OAuth. OAuth would need a person sitting in front of a consent screen
 * and would tie the connection to whoever clicked, which is the wrong shape
 * for a cron. S2S carries the identity of the *app* instead, issued against
 * the one organisation that installed it.
 *
 * Four steps, and they are not interchangeable:
 *
 *   1. The portal holds our public key and gives back an S2S GUID.
 *   2. We sign a short-lived JWT with the private half — the "app token".
 *      It proves we are the app, and nothing more.
 *   3. The app token buys an installation id, once, when the org installs us.
 *   4. The app token plus the installation id buys an access token, good for
 *      an hour, and that is what the API actually accepts.
 *
 * Steps 2 and 4 run on every cold start. Step 3 runs once, ever, and its
 * answer is kept in the database because the token that produces it lives
 * fifteen minutes and is never issued twice.
 *
 * Written from Outreach's own documentation rather than from memory. The
 * cost of guessing an API shape has been paid enough times on this project.
 * https://developers.outreach.io/api/s2s-access
 */

const API = "https://api.outreach.io";
const TIMEOUT_MS = 30_000;

/** Where the installation id lives once we have it. */
export const INSTALL_ID_KEY = "outreach.installId";

/**
 * The two values the portal hands over, under either name they were saved as.
 *
 * The prefixed names are the ones documented here; the bare ones are what
 * Outreach's portal calls them, and so what tends to get typed into Railway.
 * Both are read rather than one being declared correct — a connector that
 * silently does nothing because of a variable name is the least useful
 * failure there is.
 */
export const s2sGuid = () =>
  (process.env.OUTREACH_S2S_GUID || process.env.S2S_GUID || "").trim();

export const privateKey = () =>
  process.env.OUTREACH_PRIVATE_KEY || process.env.S2S_PRIVATE_KEY || "";

export const outreachConfigured = () => Boolean(s2sGuid() && privateKey());

function appToken(): string {
  if (!outreachConfigured()) {
    const missing = [
      s2sGuid() ? null : "OUTREACH_S2S_GUID (or S2S_GUID)",
      privateKey() ? null : "OUTREACH_PRIVATE_KEY",
    ].filter(Boolean);
    throw new OutreachError(
      `Outreach isn't connected on this service. Missing ${missing.join(" and ")} in Railway.`,
    );
  }
  return signAppToken(s2sGuid(), privateKey());
}

/** POST to an Outreach app endpoint carrying the app token. */
async function postAsApp(path: string): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appToken()}`,
      Accept: "application/vnd.api+json",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((e: unknown) => {
    throw new OutreachError(
      `Couldn't reach Outreach.${e instanceof Error ? ` ${e.message}` : ""}`,
    );
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new OutreachError(explain(res.status), res.status, text.slice(0, 2000));
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new OutreachError(
      "Outreach replied with something that isn't JSON.",
      res.status,
      text.slice(0, 2000),
    );
  }
}

function explain(status: number): string {
  if (status === 401)
    return "Outreach rejected the app token. Check that the S2S GUID matches the app whose public key was uploaded, and that OUTREACH_PRIVATE_KEY is the private half of that same pair.";
  if (status === 403)
    return "Outreach accepted who we are but refused the request. The app is most likely missing a scope — check kaiaRecordings is ticked under API Access (S2S).";
  if (status === 404)
    return "Outreach doesn't recognise that installation. If the app was uninstalled and reinstalled, the installation id changed and needs capturing again.";
  if (status === 410)
    return "That setup token has expired. It's good for fifteen minutes — reinstall the app in Outreach to get a fresh one.";
  if (status === 429) return "Outreach is rate limiting us. Try again shortly.";
  if (status >= 500) return "Outreach had a server error.";
  return `Outreach refused the request (HTTP ${status}).`;
}

/**
 * Turn the token Outreach hands us at install time into a lasting id.
 *
 * The setup token is valid for fifteen minutes and is delivered exactly once,
 * as a query parameter on the redirect after an org admin installs the app.
 * Miss the window and the only way back is to uninstall and reinstall — so
 * the id it yields is written to the database immediately, before anything
 * else is attempted with it.
 */
export async function exchangeSetupToken(setupToken: string): Promise<{
  installId: string;
  org?: string;
}> {
  const json = (await postAsApp(
    `/api/app/installs/${encodeURIComponent(setupToken)}/actions/setupToken`,
  )) as {
    data?: { id?: string | number; attributes?: Record<string, unknown> };
  };

  const id = json?.data?.id;
  if (id === undefined || id === null || `${id}` === "") {
    throw new OutreachError(
      "Outreach accepted the setup token but didn't return an installation id.",
      200,
      JSON.stringify(json).slice(0, 2000),
    );
  }

  const attrs = json.data?.attributes ?? {};
  const org =
    typeof attrs.orgShortname === "string"
      ? attrs.orgShortname
      : typeof attrs.organization === "string"
        ? attrs.organization
        : undefined;

  await db.appSetting.upsert({
    where: { key: INSTALL_ID_KEY },
    create: { key: INSTALL_ID_KEY, value: `${id}` },
    update: { value: `${id}` },
  });

  return { installId: `${id}`, org };
}

/**
 * The installation id, from wherever it was put.
 *
 * An environment variable wins, so an id captured by hand can be set without
 * a database write; otherwise it is whatever the install callback stored.
 */
export async function installId(): Promise<string | null> {
  const fromEnv = process.env.OUTREACH_INSTALL_ID?.trim();
  if (fromEnv) return fromEnv;
  const row = await db.appSetting.findUnique({ where: { key: INSTALL_ID_KEY } });
  return row?.value?.trim() || null;
}

let cached: { token: string; expiresAt: number } | null = null;

/** The token the API itself accepts. Good for an hour; cached until it isn't. */
export async function accessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const install = await installId();
  if (!install) {
    throw new OutreachError(
      "Outreach hasn't been installed into the organisation yet, so there's no installation id to get a token for. Install the app from the Outreach developer portal with the setup URL pointing at /api/outreach/install.",
    );
  }

  const json = (await postAsApp(
    `/api/app/installs/${encodeURIComponent(install)}/actions/accessToken`,
  )) as {
    data?: { attributes?: { accessToken?: string; expiresAt?: string } };
    access_token?: string;
    expires_in?: number;
  };

  // Outreach's app endpoints speak JSON:API, but this token has been seen
  // described both ways. Take whichever is actually there rather than
  // insisting on the shape we expected.
  const token = json?.data?.attributes?.accessToken ?? json?.access_token ?? null;

  if (!token) {
    throw new OutreachError(
      "Outreach issued a reply with no access token in it.",
      200,
      JSON.stringify(json).slice(0, 2000),
    );
  }

  const expiresAt = json?.data?.attributes?.expiresAt
    ? Date.parse(json.data.attributes.expiresAt)
    : Date.now() + (json?.expires_in ?? 3600) * 1000;

  cached = {
    token,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 3_600_000,
  };
  return token;
}

/** Drop the cached token. Used when a call comes back 401 mid-hour. */
export function forgetToken() {
  cached = null;
}

export { OutreachError } from "@/lib/outreach/errors";
export { normalisePem, signAppToken } from "@/lib/outreach/jwt";
