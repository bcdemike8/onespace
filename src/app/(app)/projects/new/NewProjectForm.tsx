"use client";

import { useActionState, useMemo, useState } from "react";
import { createProjectAction } from "@/app/actions/projects";
import { BillingTypeField } from "@/components/BillingTypeField";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
  taskCount: number;
  totalHours: number;
  spanDays: number | null;
}

export function NewProjectForm({
  templates,
  clients,
  partners,
  people,
  defaultStart,
}: {
  templates: TemplateOption[];
  clients: { id: string; name: string }[];
  partners: { id: string; name: string }[];
  people: { id: string; name: string }[];
  defaultStart: string;
}) {
  const [state, action] = useActionState(createProjectAction, {});
  const [templateId, setTemplateId] = useState("");

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  // "Amplify Core (1-19 seats)" becomes the option "1-19 seats" under an
  // "Amplify Core" heading, so eight near-identical SOW names read as three
  // families rather than eight strings to compare character by character.
  // Only worth doing where a family actually has siblings — a lone template
  // keeps its full name, which also stops a "(2)" dedupe suffix from being
  // mistaken for a variant.
  const grouped = useMemo(() => {
    const split = (name: string) => /^(.*?)\s*\(([^()]*)\)\s*$/.exec(name);

    const familySize = new Map<string, number>();
    for (const t of templates) {
      const m = split(t.name);
      if (m) familySize.set(m[1], (familySize.get(m[1]) ?? 0) + 1);
    }

    const out = new Map<string, (TemplateOption & { optionLabel: string })[]>();
    for (const t of templates) {
      const m = split(t.name);
      const family = m && (familySize.get(m[1]) ?? 0) > 1;
      const group = family ? (m as RegExpExecArray)[1] : "Other templates";
      const optionLabel = family ? (m as RegExpExecArray)[2] : t.name;
      out.set(group, [...(out.get(group) ?? []), { ...t, optionLabel }]);
    }

    // Families first, the catch-all last.
    return [...out.entries()].sort(([a], [b]) =>
      a === "Other templates" ? 1 : b === "Other templates" ? -1 : a.localeCompare(b),
    );
  }, [templates]);

  return (
    <form action={action} className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-900">
          Start from a template
        </h2>
        <p className="mb-4 text-sm text-ink-500">
          Every step, subtask, owner, estimate and due-date offset comes across.
          Due dates are counted forward from the start date you pick below.
        </p>

        <label className="label" htmlFor="templateId">
          Template
        </label>
        <select
          id="templateId"
          name="templateId"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="input"
        >
          <option value="">Blank project — start empty</option>
          {grouped.map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.optionLabel}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {selected ? (
          <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50 p-3">
            <p className="text-sm font-medium text-ink-900">{selected.name}</p>
            {selected.description ? (
              <p className="mt-0.5 text-xs text-ink-600">{selected.description}</p>
            ) : null}
            <p className="mt-1 text-xs text-ink-500">
              {selected.taskCount} steps
              {selected.totalHours > 0
                ? ` · ${selected.totalHours}h budgeted`
                : ""}
              {selected.spanDays !== null
                ? ` · runs ${selected.spanDays} days`
                : ""}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-ink-500">
            {templates.length === 0
              ? "No templates yet — create this project blank and save it as a template once it looks right."
              : "No template: the project starts with no sections or steps."}
          </p>
        )}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-ink-900">Project details</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Project name
            </label>
            <input
              id="name"
              name="name"
              required
              className="input"
              placeholder={selected ? `${selected.name} — Client name` : "Project name"}
            />
          </div>

          <div>
            <label className="label" htmlFor="clientId">
              Client
            </label>
            <select id="clientId" name="clientId" className="input" defaultValue="">
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="partnerId">
              Partner <span className="font-normal text-ink-400">(who it came through)</span>
            </label>
            <select id="partnerId" name="partnerId" className="input" defaultValue="">
              <option value="">No partner</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="ownerId">
              Project owner
            </label>
            <select id="ownerId" name="ownerId" className="input" defaultValue="">
              <option value="">Unassigned</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="startDate">
              Start date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={defaultStart}
              className="input"
            />
            <p className="mt-1 text-xs text-ink-500">
              Template due dates are offset from this.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="dueDate">
              Target completion
            </label>
            <input id="dueDate" name="dueDate" type="date" className="input" />
          </div>

          <div>
            <label className="label" htmlFor="code">
              Short code <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <input id="code" name="code" className="input" placeholder="ACME-Q3" />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-ink-900">Budget &amp; billing</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="budgetHours">
              Hours budget
            </label>
            <input
              id="budgetHours"
              name="budgetHours"
              type="number"
              min="0"
              step="0.25"
              className="input"
              placeholder={selected?.totalHours ? String(selected.totalHours) : "0"}
            />
            <p className="mt-1 text-xs text-ink-500">
              {selected?.totalHours
                ? `Defaults to the template's ${selected.totalHours}h.`
                : "Leave blank for no hours budget."}
            </p>
          </div>

          <div>
            <label className="label" htmlFor="budgetAmount">
              Revenue budget
            </label>
            <input
              id="budgetAmount"
              name="budgetAmount"
              className="input"
              placeholder="25000"
            />
            <p className="mt-1 text-xs text-ink-500">
              Cost burn is measured against this.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="billRate">
              Bill rate override
            </label>
            <input id="billRate" name="billRate" className="input" placeholder="150" />
            <p className="mt-1 text-xs text-ink-500">
              Blank uses each person&apos;s own rate.
            </p>
          </div>
        </div>

        <div className="max-w-sm">
          <BillingTypeField />
        </div>
      </section>

      <ErrorNote message={state.error} />

      <div className="flex justify-end gap-2">
        <SubmitButton pendingLabel="Creating…">Create project</SubmitButton>
      </div>
    </form>
  );
}
