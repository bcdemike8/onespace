/**
 * How the New project picker headings its templates.
 *
 * Eight of the SOWs come in sibling sets - "Amplify Core (1-19 seats)",
 * "(20-49 seats)", "(50-99 seats)" - so the picker reads the family out of
 * the name and shows "1-19 seats" under an "Amplify Core" heading. Eight
 * near-identical strings become three families you can scan.
 *
 * That only works for a platform with siblings. A lone template falls into
 * "Other templates", which is where a single Salesloft SOW would land. So a
 * template can now name its own heading, and that wins when it's set.
 *
 * The inferred families still need two or more members: a template called
 * "… (variant 2)" on its own is a dedupe suffix, not a family of one, and
 * heading it "variant 2" would be worse than leaving it in the catch-all.
 */

export const OTHER = "Other templates";

export interface GroupableTemplate {
  id: string;
  name: string;
  groupName?: string | null;
}

export interface GroupedOption<T> {
  template: T;
  /** What the <option> reads, once the heading has carried the rest. */
  optionLabel: string;
}

/** "Amplify Core (1-19 seats)" -> ["Amplify Core", "1-19 seats"]. */
export function splitFamily(name: string): [string, string] | null {
  const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(name);
  return m && m[1].trim() ? [m[1].trim(), m[2].trim()] : null;
}

/**
 * Drop the heading off the front of a name, so "Salesloft — Do-It-For-You
 * Onboarding" under a "Salesloft" heading reads as "Do-It-For-You
 * Onboarding" rather than saying Salesloft twice.
 */
export function labelUnder(group: string, name: string): string {
  const lower = name.toLowerCase();
  if (!lower.startsWith(group.toLowerCase())) return name;
  const rest = name.slice(group.length).replace(/^[\s—–:-]+/, "").trim();
  if (!rest) return name;
  // "Outreach - MSO (3 Months)" under an "Outreach - MSO" heading should read
  // "3 Months", the way the inferred families already read "1-19 seats" -
  // the brackets were only ever there to separate the variant from the name.
  const unwrapped = /^\(([^()]*)\)$/.exec(rest);
  return unwrapped ? unwrapped[1].trim() || rest : rest;
}

export function groupTemplates<T extends GroupableTemplate>(
  templates: T[],
): [string, GroupedOption<T>[]][] {
  // An inferred family needs siblings to be worth a heading. An explicit
  // one doesn't - naming it is the decision.
  const familySize = new Map<string, number>();
  for (const t of templates) {
    if (t.groupName?.trim()) continue;
    const split = splitFamily(t.name);
    if (split) familySize.set(split[0], (familySize.get(split[0]) ?? 0) + 1);
  }

  const out = new Map<string, GroupedOption<T>[]>();
  for (const t of templates) {
    const explicit = t.groupName?.trim();
    let group: string;
    let optionLabel: string;

    if (explicit) {
      group = explicit;
      optionLabel = labelUnder(explicit, t.name);
    } else {
      const split = splitFamily(t.name);
      const isFamily = split !== null && (familySize.get(split[0]) ?? 0) > 1;
      group = isFamily ? split[0] : OTHER;
      optionLabel = isFamily ? split[1] : t.name;
    }

    out.set(group, [...(out.get(group) ?? []), { template: t, optionLabel }]);
  }

  // Headings alphabetically, the catch-all always last.
  return [...out.entries()].sort(([a], [b]) =>
    a === OTHER ? 1 : b === OTHER ? -1 : a.localeCompare(b),
  );
}
