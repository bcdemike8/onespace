import { NextResponse } from "next/server";
import { OutreachError, exchangeSetupToken } from "@/lib/outreach/auth";

export const dynamic = "force-dynamic";

/**
 * Where Outreach sends the browser after an org admin installs the app.
 *
 * It arrives with ?installSetupToken=..., good for fifteen minutes and
 * issued exactly once. Exchanging it yields the installation id, which is
 * the thing every later API call is made against - so it is written to the
 * database here and now, on the first request, rather than shown to somebody
 * to copy somewhere.
 *
 * No session check, deliberately. The person completing an install may not
 * be signed into OneSpace in that browser, and a sign-in redirect would
 * spend the window. That is safe because the exchange is not open: it only
 * succeeds when our own app token signs it, so a setup token invented by
 * anyone else is refused by Outreach rather than by us.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("installSetupToken");

  if (!token) {
    return page(
      "Nothing to set up",
      "This page is where Outreach lands after the app is installed. It needs an installSetupToken, and this request didn't have one — so there's nothing to do here.",
    );
  }

  try {
    const { installId, org } = await exchangeSetupToken(token);
    return page(
      "Outreach is connected",
      `OneSpace is now talking to Outreach${org ? ` as ${org}` : ""} (installation ${installId}). You can close this tab — the connection is saved.`,
    );
  } catch (e) {
    const detail =
      e instanceof OutreachError
        ? [e.message, e.body].filter(Boolean).join(" — ")
        : e instanceof Error
          ? e.message
          : "Unknown failure.";

    console.error("Outreach install exchange failed:", e);

    // The token dies in fifteen minutes and there is no second copy, so the
    // page says plainly what to do rather than leaving somebody refreshing.
    return page(
      "That didn't connect",
      `${detail}\n\nThe setup token is only valid for fifteen minutes and is issued once. If it has expired, uninstall the app in Outreach and install it again to get a fresh one.`,
      500,
    );
  }
}

/** A plain page. This is seen once, by one person, outside the app shell. */
function page(title: string, body: string, status = 200) {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return new NextResponse(
    `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)} · OneSpace</title>
<style>
 body{font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      margin:0;display:grid;place-items:center;min-height:100vh;background:#faf9f7;color:#2a2724}
 main{max-width:34rem;padding:2rem}
 h1{font-size:1.4rem;margin:0 0 .75rem}
 p{white-space:pre-wrap;color:#55504a}
 a{color:#4338ca}
</style></head>
<body><main><h1>${escape(title)}</h1><p>${escape(body)}</p>
<p><a href="/outreach">Back to OneSpace</a></p></main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
