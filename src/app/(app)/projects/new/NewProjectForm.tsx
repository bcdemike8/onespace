"use client";

import { useActionState, useMemo, useState } from "react";
import { createProjectAction } from "@/app/actions/projects";
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
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  return (
    <form action={action} className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-900">
          Start from a template
        </h2>
        <p className="mb-4 text-sm text-ink-500">
          Every task, owner, estimate and due-date offset comes across. Due
          dates are counted forward from the start date you pick below.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-colors ${
              templateId === ""
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 hover:border-ink-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="templateId"
                value=""
                checked={templateId === ""}
                onChange={() => setTemplateId("")}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-ink-900">
                Blank project
              </span>
            </span>
            <span className="mt-1 pl-6 text-xs text-ink-500">
              Start empty and add your own tasks.
            </span>
          </label>

          {templates.map((template) => (
            <label
              key={template.id}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-colors ${
                templateId === template.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink-200 hover:border-ink-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="templateId"
                  value={template.id}
                  checked={templateId === template.id}
                  onChange={() => setTemplateId(template.id)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-ink-900">
                  {template.name}
                </span>
              </span>
              <span className="mt-1 pl-6 text-xs text-ink-500">
                {template.taskCount} tasks
                {template.totalHours > 0 ? ` · ${template.totalHours}h estimated` : ""}
                {template.spanDays !== null ? ` · runs ${template.spanDays} days` : ""}
              </span>
            </label>
          ))}
        </div>

        {templates.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">
            No templates yet — you can create this project blank and save it as
            a template once it looks right.
          </p>
        ) : null}
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

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            name="billable"
            defaultChecked
            className="h-4 w-4 rounded border-ink-300"
          />
          Time on this project is billable by default
        </label>
      </section>

      <ErrorNote message={state.error} />

      <div className="flex justify-end gap-2">
        <SubmitButton pendingLabel="Creating…">Create project</SubmitButton>
      </div>
    </form>
  );
}
