"use client";

import { useState } from "react";
import { setProjectEngagementAction } from "@/app/actions/projects";
import { SubmitButton } from "@/components/SubmitButton";

export interface Engagement {
  useCases: string | null;
  kpis: string | null;
  isAmplify: boolean;
  amplifyStatus: string | null;
  amplifyProduct: string | null;
  amplifyDataProvider: string | null;
  amplifyCompetitor: string | null;
  evaluationStartDate: string;
  evaluationDueDate: string;
}

const AMPLIFY_STATUS = ["In Configuration", "In Evaluation", "Post-Eval Support"];

/**
 * What the engagement is for, in the words the weekly report needs.
 *
 * These are the RocketLane fields that don't change week to week, so they are
 * written once here instead of being retyped every Thursday. Collapsed by
 * default: a project page is read far more often than this is edited, and
 * nine mostly-empty boxes at the top of it would be nine boxes everyone
 * scrolls past.
 */
export function ProjectEngagement({
  projectId,
  value,
}: {
  projectId: string;
  value: Engagement;
}) {
  const [open, setOpen] = useState(false);
  const [amplify, setAmplify] = useState(value.isAmplify);

  const filled = [
    value.useCases,
    value.kpis,
    value.amplifyProduct,
    value.amplifyCompetitor,
  ].filter(Boolean).length;

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-ink-50"
      >
        <span>
          <span className="text-sm font-semibold text-ink-900">
            Weekly report details
          </span>
          <span className="ml-2 text-xs text-ink-500">
            {filled === 0
              ? "Nothing recorded — the Thursday report will show prompts"
              : `Use cases, KPIs${amplify ? " and the Amplify fields" : ""}`}
          </span>
        </span>
        <span className="text-ink-400">{open ? "▾" : "▸"}</span>
      </button>

      {open ? (
        <form
          action={setProjectEngagementAction}
          className="space-y-3 border-t border-ink-200 p-4"
        >
          <input type="hidden" name="id" value={projectId} />

          <div>
            <label className="label" htmlFor="useCases">
              Use case(s)
            </label>
            <textarea
              id="useCases"
              name="useCases"
              rows={2}
              defaultValue={value.useCases ?? ""}
              className="input"
              placeholder="One or two sentences on what this engagement covers."
            />
          </div>

          <div>
            <label className="label" htmlFor="kpis">
              KPIs
            </label>
            <textarea
              id="kpis"
              name="kpis"
              rows={2}
              defaultValue={value.kpis ?? ""}
              className="input"
              placeholder="Named metrics and how they'll be measured, the baseline source, and the first checkpoint date."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              name="isAmplify"
              checked={amplify}
              onChange={(e) => setAmplify(e.target.checked)}
            />
            This is an Amplify engagement
          </label>

          {/* The template says to omit these entirely on a seat deployment or
              a Deal/Forecasting build, so the form omits them too. */}
          {amplify ? (
            <div className="space-y-3 rounded-lg border border-ink-200 bg-ink-50 p-3">
              <div>
                <label className="label" htmlFor="amplifyStatus">
                  Amplify status
                </label>
                <select
                  id="amplifyStatus"
                  name="amplifyStatus"
                  defaultValue={value.amplifyStatus ?? ""}
                  className="input"
                >
                  <option value="">—</option>
                  {AMPLIFY_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="amplifyProduct">
                  Amplify product
                </label>
                <input
                  id="amplifyProduct"
                  name="amplifyProduct"
                  defaultValue={value.amplifyProduct ?? ""}
                  className="input"
                  placeholder="Research Agent, Personalization Agent, Engage sequence"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="amplifyDataProvider">
                    Data provider
                  </label>
                  <input
                    id="amplifyDataProvider"
                    name="amplifyDataProvider"
                    defaultValue={value.amplifyDataProvider ?? ""}
                    className="input"
                    placeholder="ZoomInfo"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="amplifyCompetitor">
                    Competitor
                  </label>
                  <input
                    id="amplifyCompetitor"
                    name="amplifyCompetitor"
                    defaultValue={value.amplifyCompetitor ?? ""}
                    className="input"
                    placeholder='Named tool in play, or "None."'
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="evaluationStartDate">
                    Evaluation start
                  </label>
                  <input
                    id="evaluationStartDate"
                    name="evaluationStartDate"
                    type="date"
                    defaultValue={value.evaluationStartDate}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="evaluationDueDate">
                    Evaluation due
                  </label>
                  <input
                    id="evaluationDueDate"
                    name="evaluationDueDate"
                    type="date"
                    defaultValue={value.evaluationDueDate}
                    className="input"
                  />
                </div>
              </div>
            </div>
          ) : null}

          <SubmitButton className="btn-secondary">Save</SubmitButton>
        </form>
      ) : null}
    </section>
  );
}
