import { requireAdmin } from "@/lib/auth";
import { toISODate, yearStart, today } from "@/lib/dates";
import { PageHeader } from "@/components/ui";
import { ImportClient } from "./ImportClient";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Import"
        subtitle="Bring your Asana projects and Everhour hours across. Every import previews first — nothing is written until you confirm."
      />
      <ImportClient thisYearStart={toISODate(yearStart(today()))} />
    </div>
  );
}
