import { db } from "@/lib/db";
import type { Option } from "@/components/crm/FormFields";

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

export async function partnerOptions(): Promise<Option[]> {
  const rows = await db.partner.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return rows.map((p) => ({ value: p.id, label: p.name }));
}

export async function peopleOptions(): Promise<Option[]> {
  const rows = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return rows.map((u) => ({ value: u.id, label: u.name }));
}

export async function productOptions(): Promise<Option[]> {
  const rows = await db.product.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return rows.map((p) => ({ value: p.id, label: p.name }));
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
