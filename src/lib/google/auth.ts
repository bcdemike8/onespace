import "server-only";
import { createSign } from "node:crypto";

// Google auth by service account with domain-wide delegation.
//
// The alternative is per-person OAuth: everyone clicks through a consent
// screen, everyone's refresh token has to be stored and rotated, and anyone
// who revokes it silently stops syncing. Brianna asked to connect once for the
// whole workspace instead, which is exactly what delegation is for - a Google
// Workspace admin grants the service account a fixed set of scopes over the
// domain, and the app then acts *as* a named person for a single request.
//
// Deliberately no googleapis package. It pulls in a large dependency tree to
// wrap REST calls this file makes in forty lines, and the token exchange is
// a signed JWT that node:crypto already does.

const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Read-only everywhere except sending mail, which needs its own scope. */
export const SCOPES = {
  calendar: "https://www.googleapis.com/auth/calendar.readonly",
  gmailRead: "https://www.googleapis.com/auth/gmail.readonly",
  gmailSend: "https://www.googleapis.com/auth/gmail.send",
} as const;

export const googleConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);

/**
 * Railway variables are single-line, so the key arrives with literal "\n"
 * where the newlines should be. A PEM with the wrong line breaks fails to
 * parse with an error that says nothing useful about why.
 */
function privateKey(): string {
  const raw = process.env.GOOGLE_PRIVATE_KEY ?? "";
  const key = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  return key.trim().replace(/^"|"$/g, "");
}

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

interface CachedToken {
  token: string;
  /** Epoch ms. */
  expiresAt: number;
}

// Keyed by subject + scope set. Tokens last an hour; re-minting one on every
// request would be a signature and a round trip per API call.
const cache = new Map<string, CachedToken>();

export class GoogleAuthError extends Error {}

/**
 * An access token that acts as `subject` - a real person in the Workspace.
 * Google refuses to mint one for a mailbox that doesn't exist, which is the
 * usual first symptom of a typo'd email or a person who has left.
 */
export async function getAccessToken(
  subject: string,
  scopes: string[],
): Promise<string> {
  if (!googleConfigured()) {
    throw new GoogleAuthError("Google isn't connected yet.");
  }

  const scope = [...scopes].sort().join(" ");
  const key = `${subject} ${scope}`;

  // 60s of headroom: a token that expires mid-request is a confusing 401.
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now() + 60_000) return hit.token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: process.env.GOOGLE_CLIENT_EMAIL,
      sub: subject,
      scope,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  let signature: string;
  try {
    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${claims}`);
    signature = signer.sign(privateKey(), "base64url");
  } catch {
    throw new GoogleAuthError(
      "GOOGLE_PRIVATE_KEY isn't a readable key. Paste the whole private_key value from the JSON file, including the BEGIN and END lines.",
    );
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  }).catch(() => null);

  if (!res) throw new GoogleAuthError("Couldn't reach Google.");

  const json = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } | null;

  if (!res.ok || !json?.access_token) {
    throw new GoogleAuthError(
      explainTokenError(json?.error, json?.error_description, subject),
    );
  }

  const token = json.access_token;
  cache.set(key, {
    token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  });
  return token;
}

/**
 * Google's token errors are terse and all look alike from the outside. These
 * are the ones that actually happen while setting delegation up, and each has
 * a different fix in a different console.
 */
function explainTokenError(
  code: string | undefined,
  description: string | undefined,
  subject: string,
): string {
  const detail = description ?? code ?? "no reason given";

  if (
    description?.includes("Invalid impersonation") ||
    description?.includes("not authorized")
  ) {
    return `Google won't let the app act as ${subject}. In the Admin console under Security, API controls, Domain-wide delegation, check the client ID is listed and that its scopes exactly match the ones OneSpace asks for.`;
  }
  if (code === "invalid_grant") {
    return `Google rejected the request to act as ${subject}. Either that mailbox doesn't exist in the Workspace, or domain-wide delegation hasn't been granted yet.`;
  }
  if (code === "invalid_client" || code === "unauthorized_client") {
    return "Google didn't recognise the service account. Check GOOGLE_CLIENT_EMAIL matches the client_email in the JSON key file.";
  }
  return `Google refused the token: ${detail}`;
}

/** Forget cached tokens - used after the credentials change. */
export function resetTokenCache() {
  cache.clear();
}

interface RequestOptions {
  subject: string;
  scopes: string[];
  /** Full URL, or a path relative to googleapis.com. */
  url: string;
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

export class GoogleApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly reason?: string,
  ) {
    super(message);
  }
}

/** One authenticated call, with Google's error body turned into a message. */
export async function googleRequest<T>({
  subject,
  scopes,
  url,
  method = "GET",
  body,
  query,
}: RequestOptions): Promise<T> {
  const token = await getAccessToken(subject, scopes);

  const target = new URL(url, "https://www.googleapis.com");
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined) target.searchParams.set(k, String(v));
  }

  const res = await fetch(target, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).catch(() => null);

  if (!res) throw new GoogleApiError("Couldn't reach Google.", 0);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let reason: string | undefined;
    let message = `Google returned ${res.status}.`;
    try {
      const parsed = JSON.parse(text) as {
        error?: { message?: string; errors?: { reason?: string }[] };
      };
      reason = parsed.error?.errors?.[0]?.reason;
      if (parsed.error?.message) message = parsed.error.message;
    } catch {
      // Non-JSON error body; the status is all we have.
    }
    throw new GoogleApiError(message, res.status, reason);
  }

  return (await res.json()) as T;
}
