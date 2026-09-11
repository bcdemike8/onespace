import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, formatMedium, today } from "@/lib/dates";
import { centsToInput, formatHours, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import {
  togglePersonActiveAction,
  updatePersonAction,
} from "@/app/actions/people";
import { slackStatus } from "@/app/actions/slack";
import { NewPersonForm } from "./NewPersonForm";
import { SlackPanel } from "./SlackPanel";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const admin = await requireAdmin();
  const since = addDays(today(), -29);

  const [people, recent, slack] = await Promise.all([
    db.user.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    db.timeEntry.groupBy({
      by: ["userId"],
      where: { date: { gte: since } },
      _sum: { minutes: true },
    }),
    slackStatus(),
  ]);

  const minutesByUser = new Map(
    recent.map((r) => [r.userId, r._sum.minutes ?? 0]),
  );

  return (
    <div>
      <PageHeader
        title="People"
        subtitle="Cost rate is what they cost you; bill rate is what you charge. Both feed the reports."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {people.map((person) => {
            const minutes = minutesByUser.get(person.id) ?? 0;

            return (
              <section
                key={person.id}
                className={`card p-4 ${person.isActive ? "" : "opacity-60"}`}
              >
                <form action={updatePersonAction} className="space-y-3">
                  <input type="hidden" name="id" value={person.id} />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor={`n-${person.id}`}>
                        Name
                      </label>
                      <input
                        id={`n-${person.id}`}
                        name="name"
                        defaultValue={person.name}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`e-${person.id}`}>
                        Email
                      </label>
                      <input
                        id={`e-${person.id}`}
                        name="email"
                        type="email"
                        defaultValue={person.email}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="label" htmlFor={`c-${person.id}`}>
                        Cost / hour
                      </label>
                      <input
                        id={`c-${person.id}`}
                        name="costRate"
                        defaultValue={centsToInput(person.costRateCents)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`b-${person.id}`}>
                        Bill / hour
                      </label>
                      <input
                        id={`b-${person.id}`}
                        name="billRate"
                        defaultValue={centsToInput(person.billRateCents)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`r-${person.id}`}>
                        Role
                      </label>
                      <select
                        id={`r-${person.id}`}
                        name="role"
                        defaultValue={person.role}
                        className="input"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500 tnum">
                      <span>{formatHours(minutes)}h in the last 30 days</span>
                      <span>
                        ≈ {formatMoney(Math.round((minutes * person.costRateCents) / 60))}{" "}
                        cost
                      </span>
                      {!person.isActive ? (
                        <span className="chip bg-bad-50 text-bad-700">
                          Deactivated — they can&apos;t sign in
                        </span>
                      ) : person.lastSignedInAt ? (
                        <span>
                          Last signed in {formatMedium(person.lastSignedInAt)}
                        </span>
                      ) : (
                        <span className="chip bg-warn-50 text-warn-700">
                          Never signed in
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/reports?people=${person.id}`}
                        className="text-xs text-brand-700 hover:underline"
                      >
                        Report →
                      </Link>
                      <button type="submit" className="btn-secondary btn-sm">
                        Save
                      </button>
                    </div>
                  </div>
                </form>

                {/* Outside the form above, not inside it. A form nested in a
                    form is invalid HTML: the parser throws the inner one
                    away, and every press of Set silently submitted the
                    surrounding "save this person" form instead - which
                    ignores the password field, so the password never
                    changed and nothing said so. */}
                <div className="mt-2 flex justify-end">
                  <ResetPasswordForm userId={person.id} />
                </div>

                {person.id !== admin.id ? (
                  <form
                    action={togglePersonActiveAction}
                    className="mt-2 border-t border-ink-100 pt-2"
                  >
                    <input type="hidden" name="id" value={person.id} />
                    <button
                      type="submit"
                      className="text-xs text-ink-400 hover:text-bad-700"
                    >
                      {person.isActive
                        ? "Deactivate — keeps all their logged hours"
                        : "Reactivate"}
                    </button>
                  </form>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Add someone</h2>
            <NewPersonForm />
          </section>

          <SlackPanel status={slack} />

          <div className="card p-4 text-xs leading-relaxed text-ink-500">
            <p className="mb-1 font-medium text-ink-700">About rate changes</p>
            <p>
              Rates are stamped onto each time entry when it&apos;s logged.
              Changing someone&apos;s rate here affects future entries only —
              past reports and anything you&apos;ve already invoiced stay
              exactly as they were.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
