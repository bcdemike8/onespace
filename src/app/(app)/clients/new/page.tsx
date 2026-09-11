import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { SetUpClientForm, type TemplateOption } from "./SetUpClientForm";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  await requireAdmin();

  const [templates, partners, people] = await Promise.all([
    db.projectTemplate.findMany({
      where: { archivedAt: null },
      include: { tasks: { select: { estimatedHours: true, offsetDays: true } } },
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
        title="Set up a client"
        subtitle="Everything a client needs to work properly, in one pass — the company, the email domains their people write from, and the first project."
        actions={
          <Link href="/clients" className="btn-secondary">
            Cancel
          </Link>
        }
      />
      <SetUpClientForm templates={options} partners={partners} people={people} />
    </div>
  );
}
