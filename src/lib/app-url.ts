/**
 * Where this deployment answers.
 *
 * Railway sets the domain, so nothing has to be configured for the common
 * case; APP_URL overrides it for a custom domain. Shared rather than derived
 * twice, because a link in a Slack digest and a callback URL handed to
 * Outreach have to agree about what this app's address is.
 */
export function appUrl(): string {
  const explicit = process.env.APP_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN;
  return railway ? `https://${railway}` : "http://localhost:3000";
}
