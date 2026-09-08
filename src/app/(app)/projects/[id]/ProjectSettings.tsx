"use client";

import type { BillingType } from "@prisma/client";
import { useActionState, useState } from "react";
import {
  assignAllTasksToOwnerAction,
  deleteProjectAction,
  updateProjectAction,
} from "@/app/actions/projects";
import { BillingTypeField } from "@/components/BillingTypeField";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export interface ProjectSettingsValues {
  id: string;
  name: string;
  code: string;
  clientId: string;
  partnerId: string;
  ownerId: string;
  status: string;
  startDate: string;
  dueDate: string;
  budgetHours: string;
  budgetAmount: string;
  billRate: string;
  billingType: BillingType;
}

export function ProjectSettings({
  values,
  clients,
  partners,
  people,
}: {
  values: ProjectSettingsValues;
  clients: { id: string; name: string }[];
  partners: { id: string; name: string }[];
  people: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(updateProjectAction, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        Settings
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 sm:p-8">
      <div className="card w-full max-w-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">
            Project settings
          </h2>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={values.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="p-name">
                Name
              </label>
              <input
                id="p-name"
                name="name"
                required
                defaultValue={values.name}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="p-client">
                Client
              </label>
              <select
                id="p-client"
                name="clientId"
                defaultValue={values.clientId}
                className="input"
              >
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="p-partner">
                Partner
              </label>
              <select
                id="p-partner"
                name="partnerId"
                defaultValue={values.partnerId}
                className="input"
              >
                <option value="">No partner</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="p-owner">
                Owner
              </label>
              <select
                id="p-owner"
                name="ownerId"
                defaultValue={values.ownerId}
                className="input"
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
              <label className="label" htmlFor="p-status">
                Status
              </label>
              <select
                id="p-status"
                name="status"
                defaultValue={values.status}
                className="input"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="p-code">
                Short code
              </label>
              <input
                id="p-code"
                name="code"
                defaultValue={values.code}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="p-start">
                Start date
              </label>
              <input
                id="p-start"
                name="startDate"
                type="date"
                defaultValue={values.startDate}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="p-due">
                Target completion
              </label>
              <input
                id="p-due"
                name="dueDate"
                type="date"
                defaultValue={values.dueDate}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="p-budget-hours">
                Hours budget
              </label>
              <input
                id="p-budget-hours"
                name="budgetHours"
                type="number"
                min="0"
                step="0.25"
                defaultValue={values.budgetHours}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="p-budget-amount">
                Revenue budget
              </label>
              <input
                id="p-budget-amount"
                name="budgetAmount"
                defaultValue={values.budgetAmount}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="p-bill-rate">
                Bill rate override
              </label>
              <input
                id="p-bill-rate"
                name="billRate"
                defaultValue={values.billRate}
                className="input"
                placeholder="Uses each person's rate"
              />
            </div>
          </div>

          <BillingTypeField id="p-billing" defaultValue={values.billingType} />

          <ErrorNote message={state.error} />
          {state.ok ? (
            <p className="text-sm text-good-700">Saved.</p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-ink-200 pt-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
          </div>
        </form>

        {values.ownerId ? (
          <form
            action={assignAllTasksToOwnerAction}
            className="mt-4 border-t border-ink-200 pt-4"
          >
            <input type="hidden" name="id" value={values.id} />
            <button type="submit" className="btn-secondary btn-sm">
              Give every task to the owner
            </button>
            <p className="mt-1.5 text-xs text-ink-500">
              Changing the owner already hands them anything unassigned. This
              also takes over tasks currently assigned to someone else.
            </p>
          </form>
        ) : null}

        <form
          action={deleteProjectAction}
          className="mt-4 border-t border-ink-200 pt-4"
        >
          <input type="hidden" name="id" value={values.id} />
          <button type="submit" className="btn-danger btn-sm">
            Delete this project
          </button>
          <p className="mt-1.5 text-xs text-ink-500">
            If any time has been logged against it, it&apos;s archived instead —
            deleting would take your billing history with it.
          </p>
        </form>
      </div>
    </div>
  );
}
