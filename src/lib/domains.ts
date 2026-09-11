/**
 * Whatever someone typed into a domains box, as bare domains.
 *
 * People paste "https://acme.com/about", "sales@acme.com" and
 * "www.acme.com, acme.co.uk" in roughly equal measure, and a domain that
 * doesn't match exactly is a client whose meetings never arrive - a failure
 * nobody notices for a month. So be generous here rather than strict.
 *
 * Its own module rather than sitting with the actions that use it: every
 * export from a "use server" file has to be an async server action, and this
 * is neither.
 */
export function parseDomains(input: string | null | undefined): string[] {
  if (!input) return [];
  return [
    ...new Set(
      input
        .split(/[\s,;]+/)
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
        .map((x) => x.replace(/^https?:\/\//, "").split("/")[0])
        .map((x) => (x.includes("@") ? x.slice(x.lastIndexOf("@") + 1) : x))
        .map((x) => x.replace(/^www\./, "")),
    ),
  ].filter((x) =>
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(x),
  );
}
