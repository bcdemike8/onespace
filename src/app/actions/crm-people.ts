"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * Creating a partner AE without leaving the deal.
 *
 * Called imperatively from the picker rather than through a form, which is
 * not a shortcut - a form inside the deal's form is invalid HTML that fails
 * silently, and this codebase has a check script because it shipped that bug
 * twice. A server action called as a function has no such problem.
 *
 * The AE is an ordinary contact on the partner's own account, which is what
 * it already was: Outreach and Salesloft are accounts here, typed PARTNER,
 * and their staff are contacts on them. Nothing new is invented to hold it.
 */

export type NewAe =
  | { ok: true; id: string; label: string }
  | { ok: false; error: string };

export async function createPartnerAeAction(input: {
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  clientId?: string;
}): Promise<NewAe> {
  const user = await requireUser();

  const clean = (v: string | undefined) => {
    const t = (v ?? "").trim();
    return t === "" ? null : t;
  };

  const lastName = clean(input.lastName);
  if (!lastName) return { ok: false, error: "A surname, at least." };

  const clientId = clean(input.clientId);
  if (!clientId) {
    return { ok: false, error: "Which partner do they work for?" };
  }

  const account = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, accountType: true },
  });
  if (!account) return { ok: false, error: "That partner account has gone." };

  const firstName = clean(input.firstName);
  const email = clean(input.email)?.toLowerCase() ?? null;

  // A duplicate is far more likely than a new person: the same AE gets typed
  // in twice under two spellings and then the reports disagree about who
  // brought what. Matching on email first, then on the full name.
  const existing = await db.contact.findFirst({
    where: {
      clientId,
      ...(email
        ? { email }
        : { firstName: firstName ?? undefined, lastName }),
    },
    select: { id: true, firstName: true, lastName: true },
  });

  if (existing) {
    return {
      ok: true,
      id: existing.id,
      label: `${[existing.firstName, existing.lastName].filter(Boolean).join(" ")} — ${account.name}`,
    };
  }

  const created = await db.contact.create({
    data: {
      clientId,
      firstName,
      lastName,
      title: clean(input.title),
      email,
      phone: clean(input.phone),
      ownerId: user.id,
      createdById: user.id,
      lastModifiedById: user.id,
      lastModifiedAt: new Date(),
      firstSeenAt: new Date(),
    },
    select: { id: true, firstName: true, lastName: true },
  });

  revalidatePath("/crm", "layout");

  return {
    ok: true,
    id: created.id,
    label: `${[created.firstName, created.lastName].filter(Boolean).join(" ")} — ${account.name}`,
  };
}
