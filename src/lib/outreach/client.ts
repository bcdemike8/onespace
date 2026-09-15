import "server-only";
import { OutreachError, accessToken, forgetToken } from "@/lib/outreach/auth";

const API = "https://api.outreach.io/api/v2";
const TIMEOUT_MS = 45_000;

/**
 * A read against the Outreach REST API.
 *
 * JSON:API, so the Accept header matters and the reply is always
 * {data, included?, links?, meta?}. One retry on a 401: the access token is
 * good for an hour and cached for it, and the boundary between "still valid"
 * and "not any more" falls mid-request often enough to be worth handling
 * rather than surfacing as a failure somebody has to re-run by hand.
 */
export async function outreachGet<T = unknown>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const url = `${API}${path}${query ? `?${query}` : ""}`;

  const attempt = async (): Promise<Response> => {
    const token = await accessToken();
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.api+json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((e: unknown) => {
      throw new OutreachError(
        `Couldn't reach Outreach.${e instanceof Error ? ` ${e.message}` : ""}`,
      );
    });
    return res;
  };

  let res = await attempt();
  if (res.status === 401) {
    forgetToken();
    res = await attempt();
  }

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new OutreachError(
      describe(res.status, path),
      res.status,
      text.slice(0, 2000),
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new OutreachError(
      "Outreach replied with something that isn't JSON.",
      res.status,
      text.slice(0, 2000),
    );
  }
}

/**
 * Why a read was refused, in words that say what to do about it.
 *
 * 403 is the one that matters here. Only a subset of Outreach endpoints
 * accept a server-to-server token at all, and a scope being tickable in the
 * portal is not a promise that the endpoint behind it is in that subset -
 * so the difference between "you lack the scope" and "this endpoint doesn't
 * do S2S" is the difference between a checkbox and a rethink.
 */
function describe(status: number, path: string): string {
  if (status === 401) return "Outreach rejected the access token.";
  if (status === 403)
    return `Outreach refused ${path}. Either the app is missing the scope for it, or this endpoint doesn't accept server-to-server tokens - only a subset do.`;
  if (status === 404)
    return `Outreach has no ${path} endpoint. The resource may be named differently on this API version.`;
  if (status === 422) return `Outreach rejected the query on ${path}.`;
  if (status === 429) return "Outreach is rate limiting us. Try again shortly.";
  if (status >= 500) return "Outreach had a server error.";
  return `Outreach refused the request (HTTP ${status}).`;
}

/** The JSON:API envelope, as much of it as anything here cares about. */
export type JsonApiList = {
  data?: Array<{
    id?: string | number;
    type?: string;
    attributes?: Record<string, unknown>;
    relationships?: Record<string, unknown>;
  }>;
  meta?: Record<string, unknown>;
  links?: Record<string, unknown>;
};
