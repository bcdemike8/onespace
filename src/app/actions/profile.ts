"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  MAX_AVATAR_BYTES,
  avatarProblem,
  cleanPhone,
  cleanWorkDays,
  isValidBirthday,
  isValidTimeZone,
  normalizeLinkedIn,
  parseClock,
} from "@/lib/profile";

export type ProfileState = { error?: string; ok?: boolean };

/**
 * Everything here writes to `user.id` and nowhere else.
 *
 * Not "the id in the form" — there is no id in the form. A profile action
 * that took one would be an edit-anybody endpoint the first time somebody
 * changed a hidden field, and the only thing standing between that and a
 * colleague's password reset would be a check somebody remembered to write.
 */

const refresh = () => {
  revalidatePath("/profile");
  revalidatePath("/", "layout");
};

const profileSchema = z.object({
  name: z.string().trim().min(1, "Your name can't be blank."),
  title: z.string().trim().max(120, "That title is too long.").optional(),
  phone: z.string().trim().max(60, "That phone number is too long.").optional(),
  linkedin: z.string().trim().max(300).optional(),
  timeZone: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  birthdayMonth: z.string().trim().optional(),
  birthdayDay: z.string().trim().optional(),
  workStart: z.string().trim().optional(),
  workEnd: z.string().trim().optional(),
});

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
    phone: formData.get("phone"),
    linkedin: formData.get("linkedin"),
    timeZone: formData.get("timeZone"),
    startDate: formData.get("startDate"),
    birthdayMonth: formData.get("birthdayMonth"),
    birthdayDay: formData.get("birthdayDay"),
    workStart: formData.get("workStart"),
    workEnd: formData.get("workEnd"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const {
    name,
    title,
    phone,
    linkedin,
    timeZone,
    startDate,
    workStart,
    workEnd,
    birthdayMonth,
    birthdayDay,
  } = parsed.data;

  // An emptied field clears the value. Same rule as every other edit form in
  // here: you take a thing out of a box and it is gone, not still there.
  const zone = (timeZone ?? "").trim();
  if (zone !== "" && !isValidTimeZone(zone)) {
    return { error: "That isn't a time zone this app knows. Pick one from the list." };
  }

  const linkedinRaw = (linkedin ?? "").trim();
  const linkedinUrl = linkedinRaw === "" ? null : normalizeLinkedIn(linkedinRaw);
  if (linkedinRaw !== "" && linkedinUrl === null) {
    return { error: "That doesn't look like a LinkedIn address." };
  }

  const startRaw = (startDate ?? "").trim();
  if (startRaw !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(startRaw)) {
    return { error: "A start date needs to look like 2024-03-01." };
  }

  const startRawMinutes = (workStart ?? "").trim();
  const endRawMinutes = (workEnd ?? "").trim();
  const start = startRawMinutes === "" ? null : parseClock(startRawMinutes);
  const end = endRawMinutes === "" ? null : parseClock(endRawMinutes);
  if (startRawMinutes !== "" && start === null) {
    return { error: "A start time needs to look like 9:00 or 09:00." };
  }
  if (endRawMinutes !== "" && end === null) {
    return { error: "An end time needs to look like 17:30 or 5:30pm." };
  }

  // A birthday is a month and a day together. One without the other is a
  // half-filled form, not a value worth keeping, so it clears rather than
  // storing something that would show up as "undefined 14".
  const bMonth = Number((birthdayMonth ?? "").trim());
  const bDay = Number((birthdayDay ?? "").trim());
  const hasBirthday = isValidBirthday(bMonth, bDay);
  if (
    !hasBirthday &&
    ((birthdayMonth ?? "").trim() !== "" || (birthdayDay ?? "").trim() !== "")
  ) {
    return { error: "Pick both a month and a day for your birthday, or neither." };
  }

  // getAll, so unticked boxes mean unticked rather than unchanged.
  const days = cleanWorkDays(
    formData.getAll("workDays").map((d) => Number(String(d))),
  );

  await db.user.update({
    where: { id: user.id },
    data: {
      name,
      title: (title ?? "").trim() || null,
      phone: cleanPhone(phone),
      linkedinUrl,
      timeZone: zone || null,
      startDate: startRaw === "" ? null : new Date(`${startRaw}T00:00:00.000Z`),
      workStartMinute: start,
      workEndMinute: end,
      workDays: days,
      birthdayMonth: hasBirthday ? bMonth : null,
      birthdayDay: hasBirthday ? bDay : null,
    },
  });

  refresh();
  return { ok: true };
}

/**
 * Notifications save one at a time, on the toggle.
 *
 * A Save button under a row of switches is a thing people flip and then walk
 * away from, and a digest that arrives the next morning because a save was
 * never pressed is exactly the kind of thing this setting exists to stop.
 */
export async function setNotificationAction(formData: FormData) {
  const user = await requireUser();

  const which = String(formData.get("which") ?? "");
  const on = String(formData.get("on") ?? "") === "true";

  const field =
    which === "dailyDigest"
      ? "dailyDigest"
      : which === "meetingNudges"
        ? "meetingNudges"
        : null;
  if (!field) return;

  await db.user.update({ where: { id: user.id }, data: { [field]: on } });
  refresh();
}

// ----------------------------------------------------------------- photo

export async function setAvatarAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pick an image file." };
  }

  // Cheap check before reading it into memory; the real one is on the bytes.
  if (file.size > MAX_AVATAR_BYTES * 4) {
    return { error: "That photo is far too big to send. Try a smaller one." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const problem = avatarProblem(file.type, bytes.byteLength);
  if (problem) return { error: problem };

  const now = new Date();

  await db.$transaction([
    db.userAvatar.upsert({
      where: { userId: user.id },
      create: { userId: user.id, data: bytes, mimeType: file.type },
      update: { data: bytes, mimeType: file.type },
    }),
    // What the browser caches against. Without it a new photo sits behind the
    // old one until somebody clears their cache and concludes the upload
    // silently failed.
    db.user.update({ where: { id: user.id }, data: { avatarUpdatedAt: now } }),
  ]);

  refresh();
  return { ok: true };
}

export async function removeAvatarAction(
  _prev: ProfileState,
  _formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  await db.$transaction([
    db.userAvatar.deleteMany({ where: { userId: user.id } }),
    db.user.update({ where: { id: user.id }, data: { avatarUpdatedAt: null } }),
  ]);

  refresh();
  return { ok: true };
}

// --------------------------------------------------------------- sessions

/**
 * Sign out of everything, everywhere, including here.
 *
 * The reason somebody presses this is that a laptop is somewhere it
 * shouldn't be, so it takes the current session with it rather than
 * thoughtfully sparing the one browser they might be sitting at.
 */
export async function signOutEverywhereAction() {
  const user = await requireUser();
  await db.session.deleteMany({ where: { userId: user.id } });
  await destroySession();
  redirect("/login");
}
