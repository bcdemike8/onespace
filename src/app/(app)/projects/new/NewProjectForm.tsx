"use client";

import { useActionState, useMemo, useState } from "react";
import { createProjectAction } from "@/app/actions/projects";
import { BillingTypeField } from "@/components/BillingTypeField";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";
import { groupTemplates } from "@/lib/template-groups";

export interface TemplateOption {
  id: string;
  name: string;
  groupName: string | null;
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
  defaultOwnerId,
}: {
  templates: TemplateOption[];
  clients: { id: string; name: string; domains: string[] }[];
  partners: { id: string; name: string }[];
  people: { id: string; name: string }[];
  defaultStart: string;
  defaultOwnerId?: string;
}) {
  const [state, action] = useActionState(createProjectAction, {});
  const [templateId, setTemplateId] = useState("");
  const [clientId, setClientId] = useState("");

  const client = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId],
  );

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  // Headings and option labels live in one tested place, because the rules
  // are fiddlier than they look: sibling SOWs collapse, a named group stands
  // alone, and a "(variant 2)" suffix must not be mistaken for a family.
  const grouped = useMemo(() => groupTemplates(templates), [templates]);

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
              {items.map(({ template, optionLabel }) => (
                <option key={template.id} value={template.id}>
                  {optionLabel}
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
            <select
              id="clientId"
              name="clientId"
              className="input"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.domains.length === 0 ? " — no email domain yet" : ""}
                </option>
              ))}
            </select>
          </div>

          {clientId && client && client.domains.length === 0 ? (
            <div>
              <label className="label" htmlFor="clientDomains">
                {client.name}&apos;s email domain
              </label>
              <input
                id="clientDomains"
                name="clientDomains"
                className="input"
                placeholder="acme.com"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-ink-500">
                Without it, none of {client.name}&apos;s meetings or email reach
                OneSpace — those are only pulled in for domains mapped to a
                client. Several is fine, comma-separated. You can add it later
                on the Clients page.
              </p>
            </div>
          ) : clientId && client ? (
            <p className="text-xs text-ink-500">
              Meetings and mail from{" "}
              <span className="font-medium text-ink-700">
                {client.domains.join(", ")}
              </span>{" "}
              come in against this project.
            </p>
          ) : null}

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
            <select
              id="ownerId"
              name="ownerId"
              className="input"
              defaultValue={defaultOwnerId ?? ""}
            >
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
