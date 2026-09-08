"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  type AsanaPreview,
  type CommitResult,
  type EverhourPreview,
  commitAsanaImportAction,
  commitEverhourImportAction,
  previewAsanaImportAction,
  previewEverhourImportAction,
} from "@/app/actions/import";
import { formatHours } from "@/lib/format";
import { formatMedium, toISODate } from "@/lib/dates";

type Tab = "asana" | "everhour";

export function ImportClient({ thisYearStart }: { thisYearStart: string }) {
  const [tab, setTab] = useState<Tab>("asana");

  return (
    <div>
      <div className="mb-5 flex gap-1 border-b border-ink-200">
        {(
          [
            ["asana", "Projects & tasks (Asana)"],
            ["everhour", "Time entries (Everhour)"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === value
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "asana" ? <AsanaImport /> : <EverhourImport thisYearStart={thisYearStart} />}
    </div>
  );
}

// ---------------------------------------------------------------- shared UI

function FilePicker({
  label,
  hint,
  onText,
  fileName,
}: {
  label: string;
  hint: React.ReactNode;
  onText: (text: string, name: string) => void;
  fileName: string | null;
}) {
  return (
    <div className="card p-5">
      <label className="label" htmlFor="csv">
        {label}
      </label>
      <input
        id="csv"
        type="file"
        accept=".csv,text/csv"
        className="input file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-700"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onText(await file.text(), file.name);
        }}
      />
      {fileName ? (
        <p className="mt-2 text-xs text-ink-600">
          Loaded <strong className="font-medium">{fileName}</strong>
        </p>
      ) : null}
      <div className="mt-3 text-xs leading-relaxed text-ink-500">{hint}</div>
    </div>
  );
}

function Warnings({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1.5 rounded-lg border border-warn-500/30 bg-warn-50 p-3 text-xs leading-relaxed text-warn-700">
      {items.map((w, i) => (
        <li key={i}>{w}</li>
      ))}
    </ul>
  );
}

function ColumnMap({ rows }: { rows: { field: string; column: string | null }[] }) {
  return (
    <details className="card p-4">
      <summary className="cursor-pointer text-sm font-medium text-ink-800">
        How the columns were read
      </summary>
      <table className="mt-3 w-full text-sm">
        <tbody className="divide-y divide-ink-100">
          {rows.map((r) => (
            <tr key={r.field}>
              <td className="py-1.5 pr-4 text-ink-600">{r.field}</td>
              <td className="py-1.5 font-medium">
                {r.column ?? (
                  <span className="font-normal text-ink-400">not in this file</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function PeopleTable({
  people,
  unit,
}: {
  people: { name: string; email: string; weight: number; matchedUserName: string | null }[];
  unit: "tasks" | "hours";
}) {
  if (people.length === 0) return null;
  const unmatched = people.filter((p) => !p.matchedUserName);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-200 bg-ink-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-600">
        People in this file
      </div>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-ink-100">
          {people.map((p) => (
            <tr key={`${p.name}-${p.email}`}>
              <td className="px-4 py-2">
                <div className="font-medium text-ink-900">{p.name}</div>
                {p.email ? (
                  <div className="text-xs text-ink-500">{p.email}</div>
                ) : null}
              </td>
              <td className="px-4 py-2 text-right text-xs tnum text-ink-500">
                {unit === "hours" ? `${formatHours(p.weight)}h` : `${p.weight} tasks`}
              </td>
              <td className="px-4 py-2 text-right">
                {p.matchedUserName ? (
                  <span className="chip bg-good-50 text-good-700">
                    → {p.matchedUserName}
                  </span>
                ) : (
                  <span className="chip bg-warn-50 text-warn-700">no account</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {unmatched.length > 0 ? (
        <p className="border-t border-ink-200 bg-warn-50 px-4 py-2 text-xs leading-relaxed text-warn-700">
          {unmatched.length} of these {unmatched.length === 1 ? "has" : "have"} no
          OneSpace account.{" "}
          <Link href="/people" className="font-medium underline">
            Add them under People
          </Link>{" "}
          first if you want their work attributed — otherwise their tasks come in
          unassigned and their hours are skipped.
        </p>
      ) : null}
    </div>
  );
}

function ResultPanel({ result }: { result: CommitResult }) {
  if (!result.ok) {
    return (
      <div className="rounded-lg border border-bad-500/30 bg-bad-50 p-3 text-sm text-bad-700">
        {result.error}
      </div>
    );
  }

  return (
    <div className="card border-good-500/40 p-5">
      <p className="text-sm font-semibold text-good-700">{result.message}</p>

      {result.created ? (
        <div className="mt-3 flex flex-wrap gap-4">
          {Object.entries(result.created).map(([label, count]) => (
            <div key={label}>
              <div className="text-lg font-semibold tnum text-ink-900">{count}</div>
              <div className="text-xs text-ink-500">{label}</div>
            </div>
          ))}
        </div>
      ) : null}

      {result.notes && result.notes.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-600">
          {result.notes.map((n, i) => (
            <li key={i}>• {n}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {result.projectId ? (
          <Link href={`/projects/${result.projectId}`} className="btn-primary btn-sm">
            Open the project
          </Link>
        ) : null}
        {result.templateId ? (
          <Link href={`/templates/${result.templateId}`} className="btn-secondary btn-sm">
            Open the template
          </Link>
        ) : null}
        <Link href="/reports" className="btn-secondary btn-sm">
          Reports
        </Link>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- Asana

function AsanaImport() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<AsanaPreview | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [pending, start] = useTransition();

  const [projectName, setProjectName] = useState("");
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [includeSubtasks, setIncludeSubtasks] = useState(true);
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [createTemplate, setCreateTemplate] = useState(true);
  const [templateName, setTemplateName] = useState("");

  const loadFile = (content: string, name: string) => {
    setText(content);
    setFileName(name);
    setPreview(null);
    setResult(null);

    start(async () => {
      const p = await previewAsanaImportAction(content);
      setPreview(p);
      if (p.ok && p.plan) {
        const guessed =
          p.plan.detectedProjectName ?? name.replace(/\.csv$/i, "").trim();
        setProjectName(guessed);
        setTemplateName(`${guessed} template`);
        if (p.plan.startDate) setStartDate(toISODate(new Date(p.plan.startDate)));
      }
    });
  };

  const commit = () => {
    start(async () => {
      setResult(
        await commitAsanaImportAction(text, {
          projectName,
          clientId,
          newClientName,
          startDate,
          includeSubtasks,
          includeCompleted,
          createTemplate,
          templateName,
        }),
      );
    });
  };

  if (result?.ok) {
    return (
      <div className="space-y-4">
        <ResultPanel result={result} />
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setText("");
            setFileName(null);
            setPreview(null);
            setResult(null);
          }}
        >
          Import another project
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FilePicker
        label="Asana project export (.csv)"
        fileName={fileName}
        onText={loadFile}
        hint={
          <>
            In Asana: open the project → the ▾ next to its name →{" "}
            <strong className="font-medium text-ink-700">Export / Print</strong> →{" "}
            <strong className="font-medium text-ink-700">CSV</strong>. One file per
            project. Nothing is written until you confirm on the next step.
          </>
        }
      />

      {pending && !preview ? (
        <p className="text-sm text-ink-500">Reading the file…</p>
      ) : null}

      {preview && !preview.ok ? (
        <div className="rounded-lg border border-bad-500/30 bg-bad-50 p-3 text-sm text-bad-700">
          {preview.error}
        </div>
      ) : null}

      {preview?.ok && preview.plan ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Tasks", preview.plan.taskCount],
              ["Sections", preview.plan.sections.length],
              ["Already done", preview.plan.completedCount],
              ["With due dates", preview.plan.datedCount],
            ].map(([label, value]) => (
              <div key={label as string} className="card p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  {label}
                </div>
                <div className="mt-1 text-2xl font-semibold tnum">{value}</div>
              </div>
            ))}
          </div>

          <Warnings items={preview.plan.warnings} />

          {preview.plan.sample.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="border-b border-ink-200 bg-ink-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-600">
                First few tasks
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-ink-100">
                  {preview.plan.sample.map((t, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-medium text-ink-900">{t.name}</td>
                      <td className="px-4 py-2 text-xs text-ink-500">
                        {t.section ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-ink-500">
                        {t.assignee || "unassigned"}
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-ink-500">
                        {t.due ? formatMedium(new Date(t.due)) : "no due date"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <PeopleTable people={preview.people ?? []} unit="tasks" />
          <ColumnMap rows={preview.plan.mappedColumns} />

          <div className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-ink-900">
              How it should come in
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="i-name">
                  Project name
                </label>
                <input
                  id="i-name"
                  className="input"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="i-client">
                  Client
                </label>
                <select
                  id="i-client"
                  className="input"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="">— none, or type a new one below —</option>
                  {(preview.clients ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {!clientId ? (
                <div>
                  <label className="label" htmlFor="i-newclient">
                    Or create a client
                  </label>
                  <input
                    id="i-newclient"
                    className="input"
                    placeholder="Client name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                </div>
              ) : null}

              <div>
                <label className="label" htmlFor="i-start">
                  Kickoff date
                </label>
                <input
                  id="i-start"
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <p className="mt-1 text-xs text-ink-500">
                  Used to turn due dates into template offsets.
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-ink-100 pt-4">
              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={includeSubtasks}
                  onChange={(e) => setIncludeSubtasks(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300"
                />
                <span>
                  Include Asana subtasks ({preview.plan.subtaskCount} in this file)
                  as ordinary tasks
                </span>
              </label>

              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={includeCompleted}
                  onChange={(e) => setIncludeCompleted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300"
                />
                <span>
                  Include tasks already completed ({preview.plan.completedCount}) — keep
                  these if you're importing Everhour hours that point at them
                </span>
              </label>

              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={createTemplate}
                  onChange={(e) => setCreateTemplate(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300"
                />
                <span>
                  Also save this structure as a reusable template
                </span>
              </label>

              {createTemplate ? (
                <input
                  className="input mt-1 max-w-sm"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                />
              ) : null}
            </div>
          </div>

          {result && !result.ok ? <ResultPanel result={result} /> : null}

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={commit}
              disabled={pending || !projectName.trim()}
            >
              {pending ? "Importing…" : `Import ${preview.plan.taskCount} tasks`}
            </button>
            <span className="text-xs text-ink-500">
              You can delete the project afterwards if it doesn&apos;t look right.
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------- Everhour

function EverhourImport({ thisYearStart }: { thisYearStart: string }) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<EverhourPreview | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [pending, start] = useTransition();

  const [fromISO, setFromISO] = useState(thisYearStart);
  const [toISO, setToISO] = useState("");
  const [createMissingProjects, setCreateMissingProjects] = useState(false);
  const [useExportedRates, setUseExportedRates] = useState(true);
  const [replaceImported, setReplaceImported] = useState(false);

  const runPreview = (content: string, from: string, to: string) => {
    start(async () => {
      setPreview(await previewEverhourImportAction(content, from, to));
    });
  };

  const loadFile = (content: string, name: string) => {
    setText(content);
    setFileName(name);
    setResult(null);
    runPreview(content, fromISO, toISO);
  };

  if (result?.ok) {
    return (
      <div className="space-y-4">
        <ResultPanel result={result} />
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setText("");
            setFileName(null);
            setPreview(null);
            setResult(null);
          }}
        >
          Import another file
        </button>
      </div>
    );
  }

  const unmatchedProjects = (preview?.projects ?? []).filter(
    (p) => !p.matchedProjectId,
  );

  return (
    <div className="space-y-5">
      <FilePicker
        label="Everhour time export (.csv)"
        fileName={fileName}
        onText={loadFile}
        hint={
          <>
            In Everhour: <strong className="font-medium text-ink-700">Reports</strong> →
            build a detailed time report → include at least{" "}
            <strong className="font-medium text-ink-700">
              Date, Member, Project, Task and Time
            </strong>{" "}
            → Export CSV. Add the Billable amount and Cost columns too if you have
            them — that lets OneSpace keep the rates that were actually in force.
            <br />
            <strong className="font-medium text-ink-700">
              Import your Asana projects first
            </strong>{" "}
            so these hours have somewhere to land.
          </>
        }
      />

      {text ? (
        <div className="card grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="e-from">
              From
            </label>
            <input
              id="e-from"
              type="date"
              className="input"
              value={fromISO}
              onChange={(e) => {
                setFromISO(e.target.value);
                runPreview(text, e.target.value, toISO);
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="e-to">
              To <span className="font-normal text-ink-400">(blank = no limit)</span>
            </label>
            <input
              id="e-to"
              type="date"
              className="input"
              value={toISO}
              onChange={(e) => {
                setToISO(e.target.value);
                runPreview(text, fromISO, e.target.value);
              }}
            />
          </div>
        </div>
      ) : null}

      {pending && !preview ? (
        <p className="text-sm text-ink-500">Reading the file…</p>
      ) : null}

      {preview && !preview.ok ? (
        <div className="rounded-lg border border-bad-500/30 bg-bad-50 p-3 text-sm text-bad-700">
          {preview.error}
        </div>
      ) : null}

      {preview?.ok && preview.plan ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-500">
                Entries
              </div>
              <div className="mt-1 text-2xl font-semibold tnum">
                {preview.plan.entryCount}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-500">
                Hours
              </div>
              <div className="mt-1 text-2xl font-semibold tnum">
                {formatHours(preview.plan.totalMinutes)}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-500">
                Covering
              </div>
              <div className="mt-1 text-sm font-medium">
                {preview.plan.earliest
                  ? `${formatMedium(new Date(preview.plan.earliest))} – ${
                      preview.plan.latest
                        ? formatMedium(new Date(preview.plan.latest))
                        : ""
                    }`
                  : "—"}
              </div>
            </div>
          </div>

          <Warnings items={preview.plan.warnings} />

          {preview.plan.partners.length > 0 || preview.plan.leadCount > 0 ? (
            <div className="card p-4 text-sm">
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-600">
                Also in this file
              </h3>
              {preview.plan.partners.length > 0 ? (
                <p className="text-ink-700">
                  <strong className="font-medium">Partners:</strong>{" "}
                  {preview.plan.partners.join(", ")}
                  <span className="block text-xs text-ink-500">
                    Everhour&apos;s &ldquo;client&rdquo; is who the work came
                    through. Projects created here get it as their partner, and
                    the end customer is taken from the project name.
                  </span>
                </p>
              ) : null}
              {preview.plan.leadCount > 0 ? (
                <p className="mt-2 text-ink-700">
                  <strong className="font-medium">Project leads:</strong>{" "}
                  {preview.plan.leadCount} projects name one
                  <span className="block text-xs text-ink-500">
                    Used as the project owner on anything created by this import.
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="card overflow-hidden">
            <div className="border-b border-ink-200 bg-ink-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-600">
              Projects in this file
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-ink-100">
                {(preview.projects ?? []).map((p) => (
                  <tr key={p.name}>
                    <td className="px-4 py-2">
                      <div className="font-medium text-ink-900">{p.name}</div>
                      {p.clientName ? (
                        <div className="text-xs text-ink-500">{p.clientName}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-right text-xs tnum text-ink-500">
                      {formatHours(p.minutes)}h
                    </td>
                    <td className="px-4 py-2 text-right">
                      {p.matchedProjectName ? (
                        <span className="chip bg-good-50 text-good-700">
                          → {p.matchedProjectName}
                        </span>
                      ) : (
                        <span className="chip bg-warn-50 text-warn-700">no match</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PeopleTable people={preview.people ?? []} unit="hours" />
          <ColumnMap rows={preview.plan.mappedColumns} />

          <div className="card space-y-3 p-5">
            <label className="flex items-start gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={useExportedRates}
                onChange={(e) => setUseExportedRates(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-ink-300"
                disabled={!preview.plan.hasRates}
              />
              <span>
                Use the rates implied by the export&apos;s money columns
                {preview.plan.hasRates ? (
                  <span className="block text-xs text-ink-500">
                    Keeps historical money accurate instead of applying today&apos;s
                    rates to old work.
                  </span>
                ) : (
                  <span className="block text-xs text-ink-500">
                    This file has no amount or cost columns, so each person&apos;s
                    current rates will be used.
                  </span>
                )}
              </span>
            </label>

            {preview.plan.existingImported.count > 0 ? (
              <label className="flex items-start gap-2 rounded-lg border border-warn-500/30 bg-warn-50 p-3 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={replaceImported}
                  onChange={(e) => setReplaceImported(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300"
                />
                <span>
                  Replace the {preview.plan.existingImported.count} entries
                  {" "}({formatHours(preview.plan.existingImported.minutes)}h) a
                  previous import already put on these days
                  <span className="block text-xs text-warn-700">
                    Tick this when re-importing the same period — for instance a
                    report re-exported with real dates instead of month
                    headings, where the old rows can&apos;t be matched to the
                    new ones. Leave it off and you&apos;ll get both.
                  </span>
                  <span className="block text-xs text-ink-500">
                    Only removes time that came from an import. Anything logged
                    in OneSpace — timesheets, project pages, stopwatches — is
                    left alone.
                  </span>
                </span>
              </label>
            ) : null}

            <label className="flex items-start gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={createMissingProjects}
                onChange={(e) => setCreateMissingProjects(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-ink-300"
              />
              <span>
                Create projects that don&apos;t exist yet
                {unmatchedProjects.length > 0 ? (
                  <span className="block text-xs text-warn-700">
                    {unmatchedProjects.length}{" "}
                    {unmatchedProjects.length === 1 ? "project has" : "projects have"}{" "}
                    no match in OneSpace. Without this, their hours are skipped.
                  </span>
                ) : null}
              </span>
            </label>
          </div>

          {result && !result.ok ? <ResultPanel result={result} /> : null}

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                start(async () => {
                  setResult(
                    await commitEverhourImportAction(text, {
                      fromISO,
                      toISO,
                      createMissingProjects,
                      useExportedRates,
                      replaceImported,
                    }),
                  );
                })
              }
              disabled={pending || preview.plan.entryCount === 0}
            >
              {pending
                ? "Importing…"
                : `Import ${preview.plan.entryCount} entries`}
            </button>
            <span className="text-xs text-ink-500">
              Safe to run twice — rows already imported are skipped, not duplicated.
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
