"use client";

import { useActionState, useState } from "react";
import { setUpClientAction } from "@/app/actions/projects";
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

/**
 * A client, its domains, and its first project, in one pass.
 *
 * Three records that used to live on three pages. Getting two of them right
 * is the same as getting none: a client with a project but no domain pulls
 * in no meetings and no mail and never says so. The domain field is
 * therefore first and required, above the project, with the reason next to
 * it - not buried under "advanced".
 */
export function SetUpClientForm({
  templates,
  partners,
  people,
}: {
  templates: TemplateOption[];
  partners: { id: string; name: string }[];
  people: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(setUpClientAction, {} as { error?: string });
  const [withProject, setWithProject] = useState(true);
  const [name, setName] = useState("");
  const [domains, setDomains] = useState("");
  const [templateId, setTemplateId] = useState("");

  const template = templates.find((t) => t.id === templateId);

  // A guess, not a decision: most first projects are named after the client
  // and the work. It's an editable placeholder, so a wrong guess costs
  // nothing and a right one saves typing.
  const projectPlaceholder = name ? `${name} — Implementation` : "Implementation";

  const suggestion = suggestDomain(name);
  const showSuggestion = suggestion && !domains.trim();

  return (
    <form action={action} className="space-y-6">
      {/* -------------------------------------------------------- the client */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">The client</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Company name
            </label>
            <input
              id="name"
              name="name"
              required
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-ink-500">
              As you&apos;d write it on an invoice. It shows on every report.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="notes">
              Notes <span className="font-normal text-ink-400">optional</span>
            </label>
            <input
              id="notes"
              name="notes"
              className="input"
              placeholder="Renewal in March, main contact Dana"
              maxLength={1000}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- the domains */}
      <section className="card border-brand-300 p-4">
        <div className="mb-1 flex flex-wrap items-baseline gap-2">
          <h2 className="text-sm font-semibold text-ink-900">Email domains</h2>
          <span className="chip bg-brand-100 text-brand-800">Required</span>
        </div>
        <p className="mb-3 text-xs text-ink-600">
          The domain their people email from. This is how meetings and mail
          find this client — <strong>without it OneSpace pulls in nothing for
          them and doesn&apos;t say so.</strong> It is the one field here that
          can&apos;t be filled in later without someone first noticing it&apos;s
          missing.
        </p>

        <label className="label" htmlFor="domains">
          One per line, or comma separated
        </label>
        <textarea
          id="domains"
          name="domains"
          rows={2}
          required
          className="input font-mono text-sm"
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          placeholder={"acme.com\nacme.co.uk"}
        />
        <p className="mt-1 text-xs text-ink-500">
          Paste a URL or a whole email address if that&apos;s what you have —
          <code className="ml-1">https://acme.com/about</code> and
          <code className="ml-1">dana@acme.com</code> both become
          <code className="ml-1">acme.com</code>. Add every domain they use:
          a second one for a UK arm, or an acquired brand.
        </p>

        {showSuggestion ? (
          <button
            type="button"
            onClick={() => setDomains(suggestion)}
            className="mt-2 text-xs text-brand-700 underline decoration-brand-300 hover:decoration-brand-700"
          >
            Use {suggestion}?
          </button>
        ) : null}
      </section>

      {/* ------------------------------------------------------- the project */}
      <section className="card p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="withProject"
            checked={withProject}
            onChange={(e) => setWithProject(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-semibold text-ink-900">
            Create their first project now
          </span>
        </label>
        <p className="mt-1 text-xs text-ink-500">
          Time can only be logged against a project, so a client without one
          can&apos;t be billed yet. Turn this off if you&apos;re setting them up
          ahead of the work.
        </p>

        {withProject ? (
          <div className="mt-4 space-y-4 border-t border-ink-100 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="projectName">
                  Project name
                </label>
                <input
                  id="projectName"
                  name="projectName"
                  className="input"
                  placeholder={projectPlaceholder}
                  defaultValue=""
                  required={withProject}
                />
              </div>

              <div>
                <label className="label" htmlFor="ownerId">
                  Owner <span className="font-normal text-ink-400">optional</span>
                </label>
                <select id="ownerId" name="ownerId" className="input" defaultValue="">
                  <option value="">Nobody yet</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-ink-500">
                  Any template step without its own owner falls to this person.
                </p>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="templateId">
                Template <span className="font-normal text-ink-400">optional</span>
              </label>
              <select
                id="templateId"
                name="templateId"
                className="input"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">Start empty</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {template ? (
                <p className="mt-1 text-xs text-ink-600">
                  {template.taskCount} task{template.taskCount === 1 ? "" : "s"}
                  {template.totalHours > 0 ? `, ${template.totalHours}h estimated` : ""}
                  {template.spanDays !== null ? `, over ${template.spanDays} days` : ""}
                  {template.description ? ` — ${template.description}` : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs text-ink-500">
                  A template brings its sections, tasks, owners and estimates
                  across, and dates each task from the start date below.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="startDate">
                  Starts
                </label>
                <input id="startDate" name="startDate" type="date" className="input" />
                <p className="mt-1 text-xs text-ink-500">Today if left blank.</p>
              </div>
              <div>
                <label className="label" htmlFor="dueDate">
                  Due <span className="font-normal text-ink-400">optional</span>
                </label>
                <input id="dueDate" name="dueDate" type="date" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="partnerId">
                  Came through <span className="font-normal text-ink-400">optional</span>
                </label>
                <select id="partnerId" name="partnerId" className="input" defaultValue="">
                  <option value="">Direct</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <BillingTypeField />
              <div>
                <label className="label" htmlFor="billRate">
                  Rate per hour <span className="font-normal text-ink-400">optional</span>
                </label>
                <input id="billRate" name="billRate" className="input" placeholder="150" />
                <p className="mt-1 text-xs text-ink-500">
                  Blank uses each person&apos;s own rate. Whatever applies is
                  stamped onto each entry as it&apos;s logged, so changing this
                  later never rewrites history.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="budgetHours">
                  Budget hours <span className="font-normal text-ink-400">optional</span>
                </label>
                <input id="budgetHours" name="budgetHours" className="input" placeholder="120" />
                <p className="mt-1 text-xs text-ink-500">
                  Blank takes the template&apos;s estimates, if it has any.
                </p>
              </div>
              <div>
                <label className="label" htmlFor="budgetAmount">
                  Budget amount <span className="font-normal text-ink-400">optional</span>
                </label>
                <input id="budgetAmount" name="budgetAmount" className="input" placeholder="18000" />
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <ErrorNote message={state?.error} />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton className="btn-primary" pendingLabel="Setting them up…">
          {withProject ? "Create client and project" : "Create client"}
        </SubmitButton>
        <p className="text-xs text-ink-500">
          {withProject
            ? "Nothing is written until every check passes — a name already taken or a domain belonging to someone else stops the whole thing."
            : "You can add the project from the Projects page whenever the work starts."}
        </p>
      </div>
    </form>
  );
}

/**
 * A plausible domain from the company name, offered rather than assumed.
 *
 * Right often enough to save typing on the common case, and a button rather
 * than a prefilled value so a wrong guess is never quietly accepted - a
 * wrong domain is worse than a missing one, because it looks done.
 */
function suggestDomain(name: string): string | null {
  const bare = name
    .trim()
    .toLowerCase()
    .replace(
      /\b(inc|llc|ltd|limited|corp|corporation|co|gmbh|plc|group|holdings|solutions|technologies|labs)\b\.?/g,
      "",
    )
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "");

  return bare.length >= 3 ? `${bare}.com` : null;
}
