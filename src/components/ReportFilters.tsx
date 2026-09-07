import { GRANULARITIES, RANGE_PRESETS } from "@/lib/dates";
import { GROUP_BY_OPTIONS } from "@/lib/reporting";
import type { ParsedReportParams } from "@/lib/report-params";

/**
 * A plain GET form — no client JS, no state to sync. Whatever's on screen is
 * what's in the URL, which is what the CSV export reads.
 */
export function ReportFilters({
  params,
  clients,
  projects,
  people,
  action = "/reports",
  showGrouping = true,
}: {
  params: ParsedReportParams;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientName: string | null }[];
  people: { id: string; name: string }[];
  action?: string;
  showGrouping?: boolean;
}) {
  return (
    <form action={action} className="card mb-6 space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="preset">
            Date range
          </label>
          <select
            id="preset"
            name="preset"
            defaultValue={params.preset}
            className="input"
          >
            {RANGE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="from">
            From <span className="font-normal text-ink-400">(custom only)</span>
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={params.fromISO}
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="to">
            To <span className="font-normal text-ink-400">(custom only)</span>
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={params.toISO}
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="granularity">
            Columns by
          </label>
          <select
            id="granularity"
            name="granularity"
            defaultValue={params.granularity}
            className="input"
          >
            {GRANULARITIES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showGrouping ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="group">
              Rows are
            </label>
            <select
              id="group"
              name="group"
              defaultValue={params.groupBy}
              className="input"
            >
              {GROUP_BY_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="subgroup">
              Broken down by
            </label>
            <select
              id="subgroup"
              name="subgroup"
              defaultValue={params.subGroupBy ?? ""}
              className="input"
            >
              <option value="">Nothing</option>
              {GROUP_BY_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="billable">
              Billability
            </label>
            <select
              id="billable"
              name="billable"
              defaultValue={params.billable}
              className="input"
            >
              <option value="all">All time</option>
              <option value="billable">Billable only</option>
              <option value="nonbillable">Non-billable only</option>
            </select>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <MultiSelect
          id="clients"
          label="Clients"
          selected={params.clientIds}
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
        />
        <MultiSelect
          id="projects"
          label="Projects"
          selected={params.projectIds}
          options={projects.map((p) => ({
            value: p.id,
            label: p.clientName ? `${p.clientName} — ${p.name}` : p.name,
          }))}
        />
        <MultiSelect
          id="people"
          label="People"
          selected={params.userIds}
          options={people.map((p) => ({ value: p.id, label: p.name }))}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn-primary">
          Run report
        </button>
        <a href={action} className="btn-secondary">
          Reset
        </a>
        <p className="text-xs text-ink-500">
          Hold ⌘/Ctrl to pick more than one. Nothing selected means everything.
        </p>
      </div>
    </form>
  );
}

function MultiSelect({
  id,
  label,
  options,
  selected,
}: {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        multiple
        size={4}
        defaultValue={selected}
        className="input py-1"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="px-1 py-0.5">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
