import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";

export const isAdmin = (user: { role: Role }) => user.role === "ADMIN";

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

  // Recorded so an admin can tell "wrong password" from "never tried".
  await db.user.update({
    where: { id: userId },
    data: { lastSignedInAt: new Date() },
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

/**
 * Who the app behaves as, and who is really here.
 *
 * Normally the same person. They differ when an admin is acting as somebody
 * else: `user` is the colleague, so every page, query and action behaves
 * exactly as it does for them, and `actingAdmin` is the admin who stepped in.
 */
export interface Viewer {
  user: User;
  /** Null unless an admin is acting as somebody else. */
  actingAdmin: User | null;
}

export async function getViewer(): Promise<Viewer | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true, actingAs: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;

  const target = session.actingAs;
  // Acting only holds while the real account is still an admin and the
  // target is still active. Demote somebody mid-session and the borrowed
  // view closes on their next page load rather than outliving the role.
  if (target && target.isActive && isAdmin(session.user)) {
    return { user: target, actingAdmin: session.user };
  }
  return { user: session.user, actingAdmin: null };
}

/**
 * The user the app should behave as, or null.
 *
 * Returns the acted-as colleague while an admin is acting. That is the whole
 * point — "what does Alexis see" is only answerable if every query runs as
 * Alexis — and it is also why `requireAdmin` below checks this user and not
 * the admin behind them.
 */
export async function getCurrentUser(): Promise<User | null> {
  return (await getViewer())?.user ?? null;
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
 *
 * Checked against the acted-as user on purpose. An admin acting as a member
 * loses the admin screens for as long as they are acting, which is both what
 * "see what she sees" means and the thing that stops a borrowed view from
 * being a borrowed view with extra powers.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== ("ADMIN" satisfies Role)) redirect("/");
  return user;
}

/**
 * The real signed-in admin, ignoring whoever they are acting as.
 *
 * For the two things that must answer to the person actually at the keyboard:
 * starting to act as somebody, and stopping.
 */
export async function requireRealAdmin(): Promise<User> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const real = viewer.actingAdmin ?? viewer.user;
  if (!isAdmin(real)) redirect("/");
  return real;
}

/** Start acting as somebody. Only a real admin can, and never as themselves. */
export async function startActingAs(targetId: string) {
  const real = await requireRealAdmin();
  if (targetId === real.id) return;

  const target = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true, isActive: true },
  });
  if (!target || !target.isActive) return;

  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return;

  // Keyed on the real admin's own id, so acting never chains: stepping from
  // one colleague to another re-points this session rather than nesting, and
  // stopping always lands back on the admin.
  await db.session.updateMany({
    where: { tokenHash: sha256(token), userId: real.id },
    data: { actingAsUserId: target.id, actingSince: new Date() },
  });
}

/**
 * Stop acting.
 *
 * Deliberately not behind `requireAdmin`: while acting as a member the
 * effective user is a member, and a way out that the current view disallows
 * is no way out at all.
 */
export async function stopActingAs() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return;
  await db.session.updateMany({
    where: { tokenHash: sha256(token) },
    data: { actingAsUserId: null, actingSince: null },
  });
}

