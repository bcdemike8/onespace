"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export type AuthState = { error?: string };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Same message either way — don't leak which emails exist.
  const invalid = { error: "That email and password don't match." };
  if (!user || !user.isActive) return invalid;
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return invalid;
  }

  await createSession(user.id);
  redirect("/");
}

const setupSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Those passwords don't match.",
    path: ["confirm"],
  });

/**
 * First-run bootstrap. Only works while the database has no users at all,
 * so it can't be used to mint a second admin later.
 */
export async function setupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if ((await db.user.count()) > 0) {
    return { error: "This workspace is already set up. Sign in instead." };
  }

  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "ADMIN",
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
  redirect("/login");
}
