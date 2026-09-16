import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import {
  clockIn,
  linkedInHandle,
  workDaysLabel,
  workHoursLabel,
  workingNow,
} from "@/lib/profile";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Who's here, what they do, and whether it is a reasonable hour where they
 * are.
 *
 * The read side of the profile page, and the reason a personal time zone is
 * worth storing at all: a field nobody else can see is a form nobody fills
 * in. Everyone signed in can see this — there is nothing on it that isn't
 * already on an email signature.
 *
 * Rates are deliberately absent. What a colleague costs is an admin's
 * business, and it lives on the People page behind requireAdmin.
 */
export default async function TeamPage() {
  const me = await requireUser();
  const now = new Date();

  const people = await db.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      title: true,
      phone: true,
      linkedinUrl: true,
      startDate: true,
      timeZone: true,
      workStartMinute: true,
      workEndMinute: true,
      workDays: true,
      slackUserId: true,
      avatarUpdatedAt: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${people.length} ${people.length === 1 ? "person" : "people"}. Everything here comes from each person's own profile.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {people.map((person) => {
          const local = person.timeZone ? clockIn(person.timeZone, now) : null;
          const at = workingNow(person, now);
          const hours = workHoursLabel(person.workStartMinute, person.workEndMinute);
          const days = workDaysLabel(person.workDays);

          return (
            <section key={person.id} className="card p-4">
              <div className="flex items-start gap-3">
                <Avatar person={person} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {person.name}
                    {person.id === me.id ? (
                      <span className="ml-1 text-xs font-normal text-ink-400">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-ink-500">
                    {person.title ?? (person.role === "ADMIN" ? "Admin" : "—")}
                  </p>
                </div>
                {at === null ? null : (
                  <span
                    className={`chip ${at ? "bg-good-50 text-good-700" : "bg-ink-100 text-ink-500"}`}
                  >
                    {at ? "Working" : "Off"}
                  </span>
                )}
              </div>

              <dl className="mt-3 space-y-1.5 text-xs">
                <Row label="Email">
                  <a href={`mailto:${person.email}`} className="underline">
                    {person.email}
                  </a>
                </Row>
                {person.phone ? (
                  <Row label="Phone">
                    <a href={`tel:${person.phone}`} className="underline">
                      {person.phone}
                    </a>
                  </Row>
                ) : null}
                {local ? (
                  <Row label="Local time">
                    {local}
                    <span className="text-ink-400"> · {person.timeZone}</span>
                  </Row>
                ) : null}
                {days || hours ? (
                  <Row label="Works">
                    {[days, hours].filter(Boolean).join(", ")}
                  </Row>
                ) : null}
                {person.linkedinUrl ? (
                  <Row label="LinkedIn">
                    <a
                      href={person.linkedinUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline"
                    >
                      {linkedInHandle(person.linkedinUrl)}
                    </a>
                  </Row>
                ) : null}
                {person.startDate ? (
                  <Row label="Started">{formatMedium(person.startDate)}</Row>
                ) : null}
              </dl>

              {person.id === me.id ? (
                <Link
                  href="/profile"
                  className="mt-3 inline-block text-xs text-brand-700 underline"
                >
                  Edit your profile
                </Link>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-ink-500">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-ink-800">{children}</dd>
    </div>
  );
}
