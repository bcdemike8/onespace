import Link from "next/link";

export type SortDir = "asc" | "desc";

/**
 * A column heading that sorts. Clicking the active column flips direction;
 * clicking another switches to it, starting in the direction that's most
 * useful for that kind of value (biggest-first for numbers, soonest-first
 * for dates).
 */
export function SortHeader({
  label,
  column,
  activeColumn,
  activeDir,
  defaultDir = "asc",
  href,
  align = "left",
}: {
  label: string;
  column: string;
  activeColumn: string;
  activeDir: SortDir;
  defaultDir?: SortDir;
  /** Builds the target URL for a given sort column and direction. */
  href: (column: string, dir: SortDir) => string;
  align?: "left" | "right";
}) {
  const active = activeColumn === column;
  const nextDir: SortDir = active
    ? activeDir === "asc"
      ? "desc"
      : "asc"
    : defaultDir;

  return (
    <th className={`th ${align === "right" ? "text-right" : "text-left"}`}>
      <Link
        href={href(column, nextDir)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-ink-900 ${
          active ? "text-ink-900" : ""
        }`}
        aria-label={`Sort by ${label}, ${nextDir}ending`}
      >
        {label}
        <span aria-hidden className={active ? "text-brand-700" : "text-ink-300"}>
          {active ? (activeDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </Link>
    </th>
  );
}
