import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/ui";
import { NewTemplateForm } from "./NewTemplateForm";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await requireAdmin();

  const templates = await db.projectTemplate.findMany({
    include: {
      tasks: { select: { estimatedHours: true, offsetDays: true } },
      _count: { select: { projects: true, sections: true } },
    },
    orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle="The repeatable playbooks. Build one here, then stamp out a project from it in seconds."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {templates.length === 0 ? (
            <EmptyState
              title="No templates yet."
              body="A template holds the steps, who normally does them, how long they take and when they're due relative to kickoff."
            />
          ) : (
            <div className="space-y-3">
              {templates.map((template) => {
                const hours = template.tasks.reduce(
                  (sum, t) => sum + (t.estimatedHours ?? 0),
                  0,
                );
                const offsets = template.tasks
                  .map((t) => t.offsetDays)
                  .filter((o): o is number => o !== null);

                return (
                  <Link
                    key={template.id}
                    href={`/templates/${template.id}`}
                    className="card block p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-ink-900">
                          {template.name}
                          {template.archivedAt ? (
                            <span className="ml-2 chip bg-ink-100 text-ink-500">
                              Archived
                            </span>
                          ) : null}
                        </h2>
                        {template.description ? (
                          <p className="mt-0.5 text-sm text-ink-500">
                            {template.description}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-xs text-ink-400">
                        {template._count.projects} project
                        {template._count.projects === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 tnum">
                      <span>{template.tasks.length} steps</span>
                      <span>{template._count.sections} sections</span>
                      {hours > 0 ? <span>{hours}h estimated</span> : null}
                      {offsets.length ? (
                        <span>runs {Math.max(...offsets)} days</span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">
              New template
            </h2>
            <NewTemplateForm />
          </section>

          <p className="mt-4 text-xs leading-relaxed text-ink-500">
            Already running a project that looks right? Open it and hit{" "}
            <strong className="font-medium text-ink-700">Save as template</strong>{" "}
            — its tasks, owners, estimates and due dates become a reusable
            playbook, with due dates converted to day offsets from kickoff.
          </p>
        </div>
      </div>
    </div>
  );
}
