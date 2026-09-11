"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { parseMoneyToCents } from "@/lib/format";

export type ActionState = { error?: string; ok?: boolean };

const refresh = () => {
  revalidatePath("/people", "layout");
  revalidatePath("/reports", "layout");
};

const personSchema = z.object({
  name: z.string().trim().min(1, "Enter a name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["ADMIN", "MEMBER"]),
  costRate: z.string().trim().optional().nullable(),
  billRate: z.string().trim().optional().nullable(),
});

export async function createPersonAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = personSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role") || "MEMBER",
    costRate: formData.get("costRate"),
    billRate: formData.get("billRate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const password = String(formData.get("password") ?? "").trim();
  if (password.length < 8) {
    return { error: "Set a starting password of at least 8 characters." };
  }

  if (await db.user.findUnique({ where: { email: parsed.data.email } })) {
    return { error: "Someone already has that email address." };
  }

  const costRateCents = parseMoneyToCents(parsed.data.costRate ?? "");
  const billRateCents = parseMoneyToCents(parsed.data.billRate ?? "");
  if (costRateCents === null || billRateCents === null) {
    return { error: "Rates need to be plain numbers, e.g. 45 or 125.50." };
  }

  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hashPassword(password),
      costRateCents,
      billRateCents,
    },
  });

  refresh();
  return { ok: true };
}

/**
 * Editing rates only changes future entries — existing ones keep the rate
 * that was snapshotted when they were logged.
 */
export async function updatePersonAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const parsed = personSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role") || "MEMBER",
    costRate: formData.get("costRate"),
    billRate: formData.get("billRate"),
  });
  if (!parsed.success) return;

  const costRateCents = parseMoneyToCents(parsed.data.costRate ?? "");
  const billRateCents = parseMoneyToCents(parsed.data.billRate ?? "");
  if (costRateCents === null || billRateCents === null) return;

  // Don't let the last admin demote themselves out of the workspace.
  const role =
    admin.id === id && parsed.data.role !== "ADMIN"
      ? (await db.user.count({ where: { role: "ADMIN", isActive: true } })) <= 1
        ? "ADMIN"
        : parsed.data.role
      : parsed.data.role;

  await db.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role,
      costRateCents,
      billRateCents,
    },
  });

  refresh();
}

/**
 * Deactivating keeps every hour this person ever logged — reports and past
 * invoices must not change because someone left.
 */
export async function togglePersonActiveAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const person = await db.user.findUnique({ where: { id } });
  if (!person) return;

  if (person.isActive) {
    if (person.id === admin.id) return; // can't lock yourself out
    const activeAdmins = await db.user.count({
      where: { role: "ADMIN", isActive: true },
    });
    if (person.role === "ADMIN" && activeAdmins <= 1) return;
  }

  await db.user.update({
    where: { id },
    data: { isActive: !person.isActive },
  });

  // Deactivating ends their session and any timer they left running.
  if (person.isActive) {
    await db.session.deleteMany({ where: { userId: id } });
    await db.runningTimer.deleteMany({ where: { userId: id } });
  }

  refresh();
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "").trim();
  if (password.length < 8) return { error: "Use at least 8 characters." };

  await db.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(password) },
  });

  // Force a fresh sign-in everywhere.
  await db.session.deleteMany({ where: { userId: id } });

  refresh();
  return { ok: true };
}

export async function changeOwnPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (!(await verifyPassword(current, user.passwordHash))) {
    return { error: "Your current password isn't right." };
  }
  if (next.length < 8) return { error: "Use at least 8 characters." };
  if (next !== confirm) return { error: "Those passwords don't match." };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  return { ok: true };
}
