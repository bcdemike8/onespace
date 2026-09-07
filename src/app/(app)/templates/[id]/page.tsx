import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Stat } from "@/components/ui";
import {
  createTemplateSectionAction,
  deleteTemplateSectionAction,
  deleteTemplateTaskAction,
  duplicateTemplateAction,
  moveTemplateTaskAction,
  updateTemplateAction,
} from "@/app/actions/templates";
import { AddTemplateTaskForm } from "./AddTemplateTaskForm";

export const dynamic = "force-dynamic";

const offsetLabel = (offset: number | null) => {
  if (offset === null) return "No due date";
  if (offset === 0) return "Due on kickoff day";
  if (offset < 0) return `Due ${-offset} days before kickoff`;
  return `Due day ${offset}`;
};

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [template, people] = await Promise.all([
    db.projectTemplate.findUnique({
      where: { id },
      include: {
        sections: { orderBy: { orderIndex: "asc" } },
        tasks: {
          orderBy: [{ orderIndex: "asc" }],
          include: { defaultAssignee: { select: { name: true } } },
        },
        _count: { select: { projects: true } },
      },
    }),
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!template) notFound();

  const totalHours = template.tasks.reduce(
    (sum, t) => sum + (t.estimatedHours ?? 0),
    0,
  );
  const offsets = template.tasks
    .map((t) => t.offsetDays)
    .filter((o): o is number => o !== null);

  const groups: {
    id: string | null;
    name: string;
    tasks: typeof template.tasks;
  }[] = [
    { id: null, name: "Steps", tasks: [] },
    ...template.sections.map((s) => ({
      id: s.id,
      name: s.name,
      tasks: [] as typeof template.tasks,
    })),
  ];
  const byId = new Map(groups.map((g) => [g.id, g]));
  for (const task of template.tasks) {
    (byId.get(task.sectionId) ?? groups[0]).tasks.push(task);
  }

  return (
    <div>
      <PageHeader
        title={template.name}
        subtitle={
          template.description ??
          "Steps, owners, estimates and due-date offsets from kickoff."
        }
        actions={
          <>
            <Link href="/projects/new" className="btn-primary">
              Use this template
            </Link>
            <form action={duplicateTemplateAction}>
              <input type="hidden" name="id" value={template.id} />
              <button type="submit" className="btn-secondary">
                Duplicate
              </button>
            </form>
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Steps" value={template.tasks.length} />
        <Stat label="Estimated" value={`${totalHours}h`} />
        <Stat
          label="Timeline"
          value={offsets.length ? `${Math.max(...offsets)} days` : "—"}
          hint="From kickoff to the last due date"
        />
        <Stat
          label="Projects created"
          value={template._count.projects}
          hint="Using this playbook"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {groups
            .filter((g) =>
              g.id === null
                ? g.tasks.length > 0 || template.sections.length === 0
                : true,
            )
            .map((group) => (
              <section key={group.id ?? "none"} className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-4 py-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                    {group.name}
                  </h3>
                  {group.id ? (
                    <form action={deleteTemplateSectionAction}>
                      <input type="hidden" name="id" value={group.id} />
                      <button
                        type="submit"
                        className="text-xs text-ink-400 hover:text-bad-700"
                      >
                        remove
                      </button>
                    </form>
                  ) : null}
                </div>

                {group.tasks.length > 0 ? (
                  <ul className="divide-y divide-ink-100">
                    {group.tasks.map((task) => (
                      <li
                        key={task.id}
                        className="group flex items-start gap-3 px-4 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-ink-900">
                            {task.name}
                          </div>
                          {task.description ? (
                            <p className="mt-0.5 text-xs text-ink-500">
                              {task.description}
                            </p>
                          ) : null}
                          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-500">
                            <span>{offsetLabel(task.offsetDays)}</span>
                            <span>
                              {task.defaultAssignee?.name ?? "Assign later"}
                            </span>
                            {task.estimatedHours ? (
                              <span className="tnum">{task.estimatedHours}h</span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <form action={moveTemplateTaskAction}>
                            <input type="hidden" name="id" value={task.id} />
                            <input type="hidden" name="direction" value="up" />
                            <button
                              type="submit"
                              className="btn-ghost btn-sm opacity-0 group-hover:opacity-100"
                              aria-label="Move up"
                            >
                              ↑
                            </button>
                          </form>
                          <form action={moveTemplateTaskAction}>
                            <input type="hidden" name="id" value={task.id} />
                            <input type="hidden" name="direction" value="down" />
                            <button
                              type="submit"
                              className="btn-ghost btn-sm opacity-0 group-hover:opacity-100"
                              aria-label="Move down"
                            >
                              ↓
                            </button>
                          </form>
                          <form action={deleteTemplateTaskAction}>
                            <input type="hidden" name="id" value={task.id} />
                            <button
                              type="submit"
                              className="btn-ghost btn-sm text-ink-400 opacity-0 hover:text-bad-700 group-hover:opacity-100"
                              aria-label={`Delete ${task.name}`}
                            >
                              ×
                            </button>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="border-t border-ink-100">
                  <AddTemplateTaskForm
                    templateId={template.id}
                    sectionId={group.id}
                    people={people}
                  />
                </div>
              </section>
            ))}

          <form action={createTemplateSectionAction} className="flex gap-2">
            <input type="hidden" name="templateId" value={template.id} />
            <input
              name="name"
              placeholder="New section — e.g. Week 1"
              className="input max-w-xs"
              autoComplete="off"
            />
            <button type="submit" className="btn-secondary">
              Add section
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">
              Template details
            </h2>
            <form action={updateTemplateAction} className="space-y-3">
              <input type="hidden" name="id" value={template.id} />
              <div>
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  defaultValue={template.name}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={template.description ?? ""}
                  className="input"
                />
              </div>
              <button type="submit" className="btn-secondary w-full">
                Save
              </button>
            </form>
          </section>

          <div className="card p-4 text-xs leading-relaxed text-ink-500">
            <p className="mb-1 font-medium text-ink-700">
              How due dates work
            </p>
            <p>
              Each step&apos;s <strong>due day</strong> is counted forward from
              the project&apos;s start date. Day 0 is kickoff, day 5 is five
              days later, and a negative number means it&apos;s due before
              kickoff. Leave it blank for a step with no deadline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
