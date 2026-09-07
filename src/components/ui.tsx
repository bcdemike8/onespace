import Link from "next/link";
import type { ProjectStatus, TaskStatus } from "@prisma/client";
import { pct } from "@/lib/format";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    default: "text-ink-900",
    good: "text-good-700",
    warn: "text-warn-700",
    bad: "text-bad-700",
  }[tone];

  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold tnum ${toneClass}`}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-ink-500">{hint}</div> : null}
    </div>
  );
}

const TASK_STATUS_STYLE: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: "To do", className: "bg-ink-100 text-ink-600" },
  IN_PROGRESS: { label: "In progress", className: "bg-brand-50 text-brand-700" },
  BLOCKED: { label: "Blocked", className: "bg-bad-50 text-bad-700" },
  DONE: { label: "Done", className: "bg-good-50 text-good-700" },
};

export function TaskStatusChip({ status }: { status: TaskStatus }) {
  const s = TASK_STATUS_STYLE[status];
  return <span className={`chip ${s.className}`}>{s.label}</span>;
}

const PROJECT_STATUS_STYLE: Record<ProjectStatus, { label: string; className: string }> =
  {
    ACTIVE: { label: "Active", className: "bg-good-50 text-good-700" },
    ON_HOLD: { label: "On hold", className: "bg-warn-50 text-warn-700" },
    COMPLETED: { label: "Completed", className: "bg-brand-50 text-brand-700" },
    ARCHIVED: { label: "Archived", className: "bg-ink-100 text-ink-500" },
  };

export function ProjectStatusChip({ status }: { status: ProjectStatus }) {
  const s = PROJECT_STATUS_STYLE[status];
  return <span className={`chip ${s.className}`}>{s.label}</span>;
}

/** Budget burn bar. Turns amber past 85% and red past 100%. */
export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const percent = pct(value, max);
  const tone =
    percent > 100 ? "bg-bad-500" : percent > 85 ? "bg-warn-500" : "bg-good-500";

  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {label ? (
        <div className="mt-1 text-xs text-ink-500 tnum">{label}</div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {body ? <p className="mt-1 max-w-md text-sm text-ink-500">{body}</p> : null}
      {action ? (
        <Link href={action.href} className="btn-primary mt-4">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-bad-500/30 bg-bad-50 px-3 py-2 text-sm text-bad-700">
      {message}
    </p>
  );
}
