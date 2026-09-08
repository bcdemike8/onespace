import type { ProjectHealth } from "@prisma/client";

export const HEALTH_LABEL: Record<ProjectHealth, string> = {
  ON_TRACK: "On track",
  AT_RISK: "At risk",
  OFF_TRACK: "Off track",
};

const STYLE: Record<ProjectHealth, string> = {
  ON_TRACK: "bg-good-50 text-good-700",
  AT_RISK: "bg-warn-50 text-warn-700",
  OFF_TRACK: "bg-bad-50 text-bad-700",
};

const DOT: Record<ProjectHealth, string> = {
  ON_TRACK: "bg-good-500",
  AT_RISK: "bg-warn-500",
  OFF_TRACK: "bg-bad-500",
};

export function HealthChip({
  health,
  size = "md",
}: {
  health: ProjectHealth | null;
  size?: "sm" | "md";
}) {
  if (!health) {
    return (
      <span
        className={`chip bg-ink-100 text-ink-500 ${size === "sm" ? "text-[11px]" : ""}`}
      >
        No update
      </span>
    );
  }

  return (
    <span
      className={`chip ${STYLE[health]} ${size === "sm" ? "text-[11px]" : ""}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT[health]}`} />
      {HEALTH_LABEL[health]}
    </span>
  );
}
