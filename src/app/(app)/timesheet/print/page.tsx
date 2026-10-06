import { notFound } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import { dayStart, formatMedium, toISODate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import {
  buildTimesheet,
  exportFilename,
  exportHours,
  type ExportEntry,
} from "@/lib/timesheet-export";
import { PrintAgain, PrintNow } from "./PrintNow";

export const dynamic = "force-dynamic";

/**
 * The timesheet as a printable document.
 *
 * People have to file these with billing, which wants a PDF. Rather than put
 * a PDF library or a headless browser on the Railway image, this is a page
 * laid out for paper that opens the print dialog on load — every browser's
 * "Save as PDF" does the rest, and the PDF is rendered from markup anyone
 * can read on screen first.
 *
 * It deliberately carries the non-billable hours as well. The thing being
 * filed is often exactly the internal work, and a timesheet that quietly
 * dropped it would be wrong in the direction nobody checks.
 */
export default async function TimesheetPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; person?: string }>;
}) {
  const viewer = await requireUser();
  const params = await searchParams;

  if (!params.from || !params.to) notFound();
  const from = dayStart(params.from);
  const to = dayStart(params.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) notFound();

  // Same rule as the timesheet itself: your own always, anyone's if admin.
  const subjectId = isAdmin(viewer) && params.person ? params.person : viewer.id;
  const subject =
    subjectId === viewer.id
      ? viewer
      : ((await db.user.findUnique({ where: { id: subjectId } })) ?? viewer);

  const rows = await db.timeEntry.findMany({
    where: { userId: subject.id, date: { gte: from, lte: to } },
    orderBy: [{ date: "asc" }],
    select: {
      date: true,
      minutes: true,
      billable: true,
      billRateCents: true,
      notes: true,
      task: { select: { name: true } },
      project: {
        select: { name: true, client: { select: { name: true } } },
      },
    },
  });

  const doc = buildTimesheet(
    rows.map(
      (r): ExportEntry => ({
        date: r.date,
        projectName: r.project.name,
        clientName: r.project.client?.name ?? null,
        taskName: r.task?.name ?? null,
        notes: r.notes,
        minutes: r.minutes,
        billable: r.billable,
        billRateCents: r.billRateCents,
      }),
    ),
  );

  const filename = exportFilename(subject.name, toISODate(from), toISODate(to));

  return (
    <div className="print-sheet mx-auto max-w-4xl bg-white text-ink-900">
      <PrintNow filename={filename} />

      <div className="no-print mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm text-ink-600">
        <span>
          Your browser&apos;s print dialog should be open. Choose{" "}
          <strong>Save as PDF</strong> as the destination.
        </span>
        <PrintAgain />
      </div>

      <header className="mb-5 flex items-start justify-between gap-6 border-b-2 border-ink-900 pb-3">
        <div>
          <h1 className="text-xl font-semibold">Timesheet</h1>
          <p className="text-sm text-ink-600">{BRAND.name}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">{subject.name}</p>
          <p className="text-ink-600">{subject.email}</p>
          <p className="text-ink-600">
            {formatMedium(from)} – {formatMedium(to)}
          </p>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-4 gap-3 text-sm">
        <Figure label="Total hours" value={`${exportHours(doc.minutes)}h`} />
        <Figure label="Billable" value={`${exportHours(doc.billableMinutes)}h`} />
        <Figure
          label="Non-billable"
          value={`${exportHours(doc.nonBillableMinutes)}h`}
        />
        <Figure label="Days worked" value={String(doc.daysWorked)} />
      </div>

      {doc.groups.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-500">
          No time logged between {formatMedium(from)} and {formatMedium(to)}.
        </p>
      ) : (
        doc.groups.map((g) => (
          <section key={g.projectName} className="mb-5 break-inside-avoid">
            <h2 className="mb-1 border-b border-ink-300 pb-1 text-sm font-semibold">
              {g.projectName}
              {g.clientName ? (
                <span className="font-normal text-ink-600"> · {g.clientName}</span>
              ) : null}
            </h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-ink-600">
                  <th className="w-24 py-1 font-medium">Date</th>
                  <th className="py-1 font-medium">Task</th>
                  <th className="py-1 font-medium">Notes</th>
                  <th className="w-20 py-1 text-right font-medium">Hours</th>
                  <th className="w-20 py-1 text-right font-medium">Billable</th>
                </tr>
              </thead>
              <tbody>
                {g.lines.map((l, i) => (
                  <tr key={i} className="border-t border-ink-100 align-top">
                    <td className="py-1 tabular-nums">{l.dateISO}</td>
                    <td className="py-1">{l.taskName}</td>
                    <td className="py-1 text-ink-600">{l.notes ?? ""}</td>
                    <td className="py-1 text-right tabular-nums">
                      {exportHours(l.minutes)}
                    </td>
                    <td className="py-1 text-right">{l.billable ? "Yes" : "No"}</td>
                  </tr>
                ))}
                <tr className="border-t border-ink-300 font-medium">
                  <td className="py-1" colSpan={3}>
                    {g.projectName} total
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {exportHours(g.minutes)}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {exportHours(g.billableMinutes)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        ))
      )}

      <footer className="mt-6 border-t-2 border-ink-900 pt-2 text-xs text-ink-600">
        <div className="flex justify-between font-medium text-ink-900">
          <span>Total</span>
          <span className="tabular-nums">
            {exportHours(doc.minutes)}h · {exportHours(doc.billableMinutes)}h
            billable · {formatMoney(doc.billableCents)}
          </span>
        </div>
        <p className="mt-1">
          Billable value is each entry&apos;s hours at the rate stored on it
          when it was logged. Generated from {BRAND.name} on{" "}
          {formatMedium(new Date())}.
        </p>
      </footer>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-ink-200 px-3 py-2">
      <p className="text-xs text-ink-600">{label}</p>
      <p className="text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}
