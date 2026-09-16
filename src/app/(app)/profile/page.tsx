import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, formatMedium, formatMonth, monthEnd, monthStart, today } from "@/lib/dates";
import { centsToInput, formatHours } from "@/lib/format";
import {
  birthdayLabel,
  clockIn,
  formatClock,
  isValidTimeZone,
  timeZoneLabel,
  timeZoneOptions,
  workDaysLabel,
  workHoursLabel,
} from "@/lib/profile";
import { Avatar } from "@/components/Avatar";
import { Stat } from "@/components/ui";
import { signOutEverywhereAction } from "@/app/actions/profile";
import { AvatarUpload } from "./AvatarUpload";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { NotificationToggle } from "./NotificationToggle";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
      {hint ? <p className="mt-0.5 mb-3 text-xs text-ink-500">{hint}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

export default async function ProfilePage() {
  const user = await requireUser();

  // Calendar months, not a rolling window. A rolling thirty days answers a
  // question nobody asks: invoices, utilisation and "have I logged enough
  // this month" are all month-shaped, and a number that quietly drops the
  // first of the month off the back can't be checked against any of them.
  const thisMonth = monthStart(today());
  const lastMonth = monthStart(addDays(thisMonth, -1));

  const minutesLogged = (from: Date, to: Date) =>
    db.timeEntry
      .aggregate({
        where: { userId: user.id, date: { gte: from, lte: to } },
        _sum: { minutes: true },
      })
      .then((r) => r._sum.minutes ?? 0);

  const [thisMonthMinutes, lastMonthMinutes, sessions] = await Promise.all([
    minutesLogged(thisMonth, monthEnd(thisMonth)),
    minutesLogged(lastMonth, monthEnd(lastMonth)),
    db.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } }),
  ]);

  const zones = timeZoneOptions()
    .map((value) => ({ value, label: timeZoneLabel(value) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // A zone somebody set before the list changed must still be selectable, or
  // saving the form would quietly wipe it.
  if (user.timeZone && !zones.some((z) => z.value === user.timeZone)) {
    zones.unshift({ value: user.timeZone, label: timeZoneLabel(user.timeZone) });
  }

  // Only what the photo control needs. Handing a client component the whole
  // user would ship this person's password hash and their rates to the
  // browser, in the RSC payload, on a page they can read the source of.
  const me = { id: user.id, name: user.name, avatarUpdatedAt: user.avatarUpdatedAt };

  const localNow =
    user.timeZone && isValidTimeZone(user.timeZone) ? clockIn(user.timeZone) : null;
  const hours = workHoursLabel(user.workStartMinute, user.workEndMinute);
  const birthday = birthdayLabel(user.birthdayMonth, user.birthdayDay);
  const days = workDaysLabel(user.workDays);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar person={me} size={64} />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {user.name}
          </h1>
          <p className="text-sm text-ink-500">
            {[user.title, user.email].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            {[
              localNow ? `${localNow} where you are` : null,
              days && hours ? `${days}, ${hours}` : days || hours || null,
              user.startDate ? `Started ${formatMedium(user.startDate)}` : null,
              birthday ? `Birthday ${birthday}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Nothing filled in yet — the form below is all optional."}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Logged this month"
          value={`${formatHours(thisMonthMinutes)}h`}
          hint={formatMonth(thisMonth)}
        />
        <Stat
          label="Logged last month"
          value={`${formatHours(lastMonthMinutes)}h`}
          hint={formatMonth(lastMonth)}
        />
        <Stat label="Role" value={user.role === "ADMIN" ? "Admin" : "Member"} />
        <Stat
          label="Your bill rate"
          value={`$${centsToInput(user.billRateCents)}`}
          hint="Set by an admin"
        />
      </div>

      <div className="space-y-4">
        <Card title="Photo">
          <AvatarUpload person={me} />
        </Card>

        <Card
          title="About you"
          hint="Everything here is optional, and everyone signed in can see it."
        >
          <ProfileForm
            zones={zones}
            values={{
              name: user.name,
              title: user.title ?? "",
              phone: user.phone ?? "",
              linkedin: user.linkedinUrl ?? "",
              timeZone: user.timeZone ?? "",
              startDate: user.startDate
                ? user.startDate.toISOString().slice(0, 10)
                : "",
              workStart: formatClock(user.workStartMinute),
              workEnd: formatClock(user.workEndMinute),
              workDays: user.workDays,
              birthdayMonth: user.birthdayMonth ? String(user.birthdayMonth) : "",
              birthdayDay: user.birthdayDay ? String(user.birthdayDay) : "",
            }}
          />
        </Card>

        <Card
          title="Sign-in and Slack"
          hint="These identify you rather than describe you, so an admin changes them on the People page."
        >
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-500">Email — your sign-in</dt>
              <dd className="text-sm text-ink-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Slack</dt>
              <dd
                className={`text-sm ${user.slackUserId ? "text-ink-900" : "text-ink-300"}`}
              >
                {user.slackUserId ? `Linked (${user.slackUserId})` : "Not linked"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card
          title="Notifications"
          hint={
            user.slackUserId
              ? "Sent to you in Slack. Turning one off stops it for you only."
              : "These are Slack messages, and your account isn't linked to Slack yet — so nothing is being sent. An admin links it on the People page."
          }
        >
          <div className="divide-y divide-ink-100">
            <NotificationToggle
              which="dailyDigest"
              on={user.dailyDigest}
              label="Morning digest"
              hint="What's due, what's overdue, and whether yesterday's time got logged. Sent on working mornings, and only when there's something to say."
            />
            <NotificationToggle
              which="meetingNudges"
              on={user.meetingNudges}
              label="Meetings waiting to be confirmed"
              hint="A reminder when a call has happened and the time hasn't been logged against it yet."
            />
          </div>
          <p className="mt-3 text-xs text-ink-500">
            The digest goes out on one schedule for the whole team, so your time
            zone changes what it says, not when it lands.
          </p>
        </Card>

        <Card
          title="Password"
          hint="Everybody started on the same password. Change yours to one only you know."
        >
          <ChangePasswordForm />
        </Card>

        <Card title="Signed in on other devices">
          <p className="text-sm text-ink-600">
            {sessions <= 1
              ? "Just this one."
              : `${sessions} places, counting this one.`}{" "}
            {user.lastSignedInAt
              ? `Last sign-in ${formatMedium(user.lastSignedInAt)}.`
              : null}
          </p>
          <form action={signOutEverywhereAction} className="mt-3">
            <button type="submit" className="btn-secondary btn-sm">
              Sign out everywhere
            </button>
          </form>
          <p className="mt-1 text-xs text-ink-500">
            Ends every session, including this one — you&rsquo;ll be asked to sign
            in again.
          </p>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        Looking for someone else&rsquo;s details?{" "}
        <Link href="/team" className="underline">
          The team is on the Team page
        </Link>
        .
      </p>
    </div>
  );
}
