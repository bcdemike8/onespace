import { db } from "@/lib/db";
import type { Option } from "@/components/crm/FormFields";
import { byPlatformOrder, isPlatform } from "@/lib/crm/platforms";

/**
 * The dropdown contents every CRM form needs.
 *
 * One place, because eight pages want the same six lists and building them
 * per page is how "active people only" becomes true on six of them.
 *
 * Contact pickers are scoped to an account rather than listing all 7,485.
 * That is not only a size argument: a deal's primary contact works at the
 * deal's company, and a picker that offers everyone invites the mistake it
 * is meant to prevent. The currently-set value is always included even if it
 * sits outside the scope, so editing a record can never silently drop a
 * relation somebody set deliberately.
 */

const personLabel = (p: {
  firstName: string | null;
  lastName: string;
  title: string | null;
}) =>
  [p.firstName, p.lastName].filter(Boolean).join(" ") +
  (p.title ? ` — ${p.title}` : "");

export async function accountOptions(exclude?: string): Promise<Option[]> {
  const rows = await db.client.findMany({
    where: { archivedAt: null, ...(exclude ? { id: { not: exclude } } : {}) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return rows.map((c) => ({ value: c.id, label: c.name }));
}

/**
 * The platforms, and only the platforms.
 *
 * The partner table holds more than platforms: the Asana import created a
 * row for every value it found in a "Partner" column, which were referring
 * companies - so the Type dropdown was offering "Murdoch Marketing" and
 * "DailyPay" alongside Outreach.
 *
 * Filtered by name against the canonical list rather than by a flag, so it
 * is right before anybody runs the cleanup script as well as after. Anything
 * a deal still points at that isn't a platform keeps showing on that deal;
 * it just isn't offered as a choice for the next one.
 */
export async function partnerOptions(): Promise<Option[]> {
  const rows = await db.partner.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true },
  });
  return rows
    .filter((p) => isPlatform(p.name))
    .sort((a, b) => byPlatformOrder(a.name, b.name))
    .map((p) => ({ value: p.id, label: p.name }));
}

/** The same list as names, for the filter rows that key on a name. */
export async function platformNames(): Promise<string[]> {
  return (await partnerOptions()).map((p) => p.label);
}

export async function peopleOptions(): Promise<Option[]> {
  const rows = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return rows.map((u) => ({ value: u.id, label: u.name }));
}

/**
 * The whole product catalogue, retired products included.
 *
 * Filtering to active-only was wrong, and wrong in the way that hides itself:
 * Salesforce marks a product inactive when it stops being sold, but a deal
 * that closed in 2023 still has to record what was actually sold in 2023.
 * A picker that offers only what is on sale today can't describe last year,
 * so the line gets typed in freehand or not recorded at all.
 *
 * Retired products are grouped under a heading rather than mixed in, so
 * picking one is deliberate.
 */
export async function productOptions(): Promise<Option[]> {
  const rows = await db.product.findMany({
    select: { id: true, name: true, code: true, active: true },
    orderBy: { name: "asc" },
  });
  return rows.map((p) => ({
    value: p.id,
    // A middot, not brackets: half these names already end in "(1-19)", and
    // "Engage Implementation (1-19) (ENG-IMP-19)" is two sets of parentheses
    // doing different jobs.
    label: p.code ? `${p.name} · ${p.code}` : p.name,
    group: p.active ? undefined : "No longer sold",
  }));
}

/**
 * Contacts at one account, plus any ids already set on the record.
 *
 * `keep` is the escape hatch: a deal whose billing contact sits at the
 * parent company keeps it through an edit rather than losing it to a picker
 * that never offered it.
 */
export async function contactOptions(
  clientId: string | null | undefined,
  keep: (string | null | undefined)[] = [],
): Promise<Option[]> {
  const ids = keep.filter((id): id is string => Boolean(id));
  if (!clientId && ids.length === 0) return [];

  const rows = await db.contact.findMany({
    where: {
      OR: [...(clientId ? [{ clientId }] : []), ...(ids.length ? [{ id: { in: ids } }] : [])],
    },
    select: { id: true, firstName: true, lastName: true, title: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return rows.map((c) => ({ value: c.id, label: personLabel(c) }));
}

/**
 * Everybody at a partner account — where a Partner AE comes from.
 *
 * Outreach and Salesloft are themselves accounts here, typed PARTNER, and
 * their staff are contacts on them. Scoping the picker that way means the
 * Partner AE field can only be filled with somebody who actually works at a
 * partner.
 */
export async function partnerContactOptions(
  keep: (string | null | undefined)[] = [],
): Promise<Option[]> {
  const ids = keep.filter((id): id is string => Boolean(id));
  const rows = await db.contact.findMany({
    where: {
      OR: [
        { client: { accountType: "PARTNER" } },
        ...(ids.length ? [{ id: { in: ids } }] : []),
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      client: { select: { name: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 500,
  });
  return rows.map((c) => ({
    value: c.id,
    label:
      [c.firstName, c.lastName].filter(Boolean).join(" ") +
      (c.client ? ` — ${c.client.name}` : ""),
  }));
}

/**
 * The partner accounts themselves - Outreach, Salesloft and the rest as
 * companies, which is what an AE gets added to.
 *
 * Accounts typed PARTNER, not the partner table: an AE is a person at a
 * company, and the company is an account like any other.
 */
export async function partnerAccountOptions(): Promise<Option[]> {
  const rows = await db.client.findMany({
    where: { accountType: "PARTNER", archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return rows.map((c) => ({ value: c.id, label: c.name }));
}
