/**
 * Who is who on a deal.
 *
 * Salesforce calls this Contact Roles, and the one everybody actually needs
 * is the billing contact — the person the invoice goes to. That one is a
 * field on the deal as well as a role here, so naming a role "Billing
 * Contact" fills the field too: nobody should have to say it twice, and a
 * billing contact recorded in only one of two places is the one the invoice
 * misses.
 *
 * Plain module, no database: the matching and the validation are the parts
 * worth testing, and tests can't import anything server-only.
 */

/** The roles RevOptics actually uses, offered as suggestions not a cage. */
export const ROLE_SUGGESTIONS = [
  "Billing Contact",
  "Decision Maker",
  "Economic Buyer",
  "Technical Buyer",
  "Executive Sponsor",
  "Project Manager",
  "Evaluator",
  "Influencer",
];

/**
 * Does this role mean "send the invoice here"?
 *
 * Matched loosely on purpose. The field is free text so the org can use its
 * own words, and "Billing", "billing contact" and "AP / Billing" all mean the
 * same thing to the person typing them.
 */
export function isBillingRole(role: string | null | undefined): boolean {
  return (role ?? "").toLowerCase().includes("billing");
}

export interface NewContact {
  firstName: string | null;
  lastName: string;
  email: string | null;
  title: string | null;
  phone: string | null;
}

/** "Dana Whitfield", or just "Whitfield" when that's all anyone knows. */
export function contactName(c: {
  firstName?: string | null;
  lastName?: string | null;
}): string {
  return [c.firstName, c.lastName].map((p) => p?.trim()).filter(Boolean).join(" ");
}

/**
 * What's wrong with this contact, in words, or null when nothing is.
 *
 * A surname is the only hard requirement, matching the contacts form: half
 * the people on a deal arrive as "Dana from AP" on a call, and refusing to
 * record them until somebody finds a full name is how they end up in a
 * notebook instead.
 */
export function contactProblem(input: {
  lastName: string;
  email: string | null;
}): string | null {
  if (!input.lastName.trim()) {
    return "A contact needs at least a surname.";
  }
  const email = input.email?.trim();
  // Deliberately shallow. The only mistakes worth catching here are the ones
  // that are certainly mistakes - a missing @, a stray space, two @s.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return `"${email}" doesn't look like an email address.`;
  }
  return null;
}

/** Trim everything, drop the blanks, lowercase the email. */
export function cleanContact(raw: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  title?: string | null;
  phone?: string | null;
}): NewContact {
  const t = (v: string | null | undefined) => {
    const s = v?.trim();
    return s ? s : null;
  };
  return {
    firstName: t(raw.firstName),
    lastName: raw.lastName?.trim() ?? "",
    email: t(raw.email)?.toLowerCase() ?? null,
    title: t(raw.title),
    phone: t(raw.phone),
  };
}
