import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";

const COOKIE = "onespace_session";
const SESSION_DAYS = 30;

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

/** Issue a session and set the cookie. Only the hash is stored server-side. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await db.session.create({
    data: { tokenHash: sha256(token), userId, expiresAt },
  });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  jar.delete(COOKIE);
}

/** The signed-in user, or null. Safe to call from any server component. */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;
  return session.user;
}

/** Use at the top of every protected page and server action. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Guard for admin-only pages and actions. A member who reaches one — by typing
 * the URL, or following a stale link — gets bounced to their own work rather
 * than a 500 page.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== ("ADMIN" satisfies Role)) redirect("/");
  return user;
}

export const isAdmin = (user: { role: Role }) => user.role === "ADMIN";
