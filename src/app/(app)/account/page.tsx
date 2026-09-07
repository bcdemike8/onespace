import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, today } from "@/lib/dates";
import { centsToInput, formatHours } from "@/lib/format";
import { PageHeader, Stat } from "@/components/ui";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();

  const thirtyDays = await db.timeEntry.aggregate({
    where: { userId: user.id, date: { gte: addDays(today(), -29) } },
    _sum: { minutes: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Your account" subtitle={user.email} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Logged (30 days)"
          value={`${formatHours(thirtyDays._sum.minutes ?? 0)}h`}
        />
        <Stat label="Role" value={user.role === "ADMIN" ? "Admin" : "Member"} />
        <Stat
          label="Your bill rate"
          value={`$${centsToInput(user.billRateCents)}`}
          hint="Set by an admin"
        />
      </div>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">
          Change password
        </h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
