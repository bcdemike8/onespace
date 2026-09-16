/**
 * The platforms RevOptics delivers on.
 *
 * A short, closed list, written down in one place because it had been
 * implied in three: the Salesforce mapping, whatever the Asana import
 * happened to find in a "Partner" column, and whatever was already in the
 * partner table. The third of those is how a deal filter came to offer
 * "Association for Talent Development" and "Murdoch Marketing" as platforms -
 * they are clients, imported years ago into the same table as Outreach.
 *
 * Pure: no database. The list is a fact about the business, and the script
 * that makes the database agree with it is a separate thing that can be run,
 * checked, and run again.
 */

export const PLATFORM_NAMES = [
  "Apollo",
  "Outreach.io",
  "RevOptics",
  "Salesloft",
  "Skaled",
  "ZoomInfo",
] as const;

export type PlatformName = (typeof PLATFORM_NAMES)[number];

/**
 * Every spelling that means one of them.
 *
 * Salesforce wrote "Outreach"; the list above says "Outreach.io"; a project
 * imported from Asana might say "outreach.io ". They are one platform, and a
 * filter that lists all three is a filter nobody can use.
 *
 * Keyed on a flattened form - lower case, no punctuation, no spaces - so a
 * spelling nobody predicted still lands if it differs only in those.
 */
const ALIASES: Record<string, PlatformName> = {
  apollo: "Apollo",
  apolloio: "Apollo",
  outreach: "Outreach.io",
  outreachio: "Outreach.io",
  outreachcorporation: "Outreach.io",
  revoptics: "RevOptics",
  salesloft: "Salesloft",
  skaled: "Skaled",
  zoominfo: "ZoomInfo",
  zoominfosl: "ZoomInfo",
};

const flatten = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/** The canonical platform this name means, or null if it isn't one. */
export function platformFor(name: string | null | undefined): PlatformName | null {
  if (!name) return null;
  return ALIASES[flatten(name)] ?? null;
}

export const isPlatform = (name: string | null | undefined): boolean =>
  platformFor(name) !== null;

/**
 * Sort partners into the order the list is written in, rather than
 * alphabetically.
 *
 * Alphabetical is fine here and the fixed order is better: the list is short
 * enough to learn, and a filter row whose buttons stay put is one people stop
 * having to read.
 */
export function platformRank(name: string): number {
  const canonical = platformFor(name);
  const at = canonical
    ? (PLATFORM_NAMES as readonly string[]).indexOf(canonical)
    : -1;
  // Anything off the list sorts after everything on it, rather than being
  // dropped - a deal pointing at it still has to be findable.
  return at === -1 ? PLATFORM_NAMES.length : at;
}

/** Platforms first and in order, then anything else alphabetically. */
export function byPlatformOrder(a: string, b: string): number {
  const ra = platformRank(a);
  const rb = platformRank(b);
  return ra === rb ? a.localeCompare(b) : ra - rb;
}
