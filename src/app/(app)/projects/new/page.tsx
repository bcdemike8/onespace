import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toISODate, today } from "@/lib/dates";
import { PageHeader } from "@/components/ui";
import { NewProjectForm, type TemplateOption } from "./NewProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  // Anyone signed in. Starting a piece of work is the ordinary act of
  // working here, not an administrative one, and the people who actually
  // start projects are the consultants delivering them.
  const user = await requireUser();

  const [templates, clients, partners, people] = await Promise.all([
    db.projectTemplate.findMany({
      where: { archivedAt: null },
      include: { tasks: { select: { estimatedHours: true, offsetDays: true } } },
      orderBy: { name: "asc" },
    }),
    db.client.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true, domains: { select: { domain: true } } },
      orderBy: { name: "asc" },
    }),
    db.partner.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const options: TemplateOption[] = templates.map((t) => {
    const offsets = t.tasks
      .map((task) => task.offsetDays)
      .filter((o): o is number => o !== null);

    return {
      id: t.id,
      name: t.name,
      groupName: t.groupName,
      description: t.description,
      taskCount: t.tasks.length,
      totalHours:
        Math.round(
          t.tasks.reduce((sum, task) => sum + (task.estimatedHours ?? 0), 0) * 100,
        ) / 100,
      spanDays: offsets.length ? Math.max(...offsets) : null,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New project"
        subtitle="Pick a template, name it, set the start date. Everything else is optional."
        actions={
          <Link href="/projects" className="btn-secondary">
            Cancel
          </Link>
        }
      />
      <NewProjectForm
        defaultOwnerId={user.id}
        templates={options}
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          domains: c.domains.map((d) => d.domain),
        }))}
        partners={partners}
        people={people}
        defaultStart={toISODate(today())}
      />
    </div>
  );
}
