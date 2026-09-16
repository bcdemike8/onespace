/**
 * The dashboard's two filters, in the URL.
 *
 * Pure, and shared between the dashboard and the reports it links to. That
 * sharing is the whole point: "View report" carries the filters across, so a
 * dashboard showing $712k opens a report showing $712k. Two modules each
 * with their own idea of what "this fiscal year" means is how those drift
 * apart, and nobody notices until a client asks.
 */

export const TYPE_PARAM = "type";
export const RANGE_PARAM = "range";

export type RangeKey = "fy" | "lastfy" | "ytd" | "all";

export interface Range {
  key: RangeKey;
  label: string;
  from: Date;
  to: Date;
}

/** The fiscal year is the calendar year here. See report.ts. */
const fyFrom = (year: number) => new Date(Date.UTC(year, 0, 1));
const fyTo = (year: number) => new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

export function ranges(today = new Date()): Range[] {
  const year = today.getUTCFullYear();
  return [
    { key: "fy", label: `FY${year}`, from: fyFrom(year), to: fyTo(year) },
    {
      key: "lastfy",
      label: `FY${year - 1}`,
      from: fyFrom(year - 1),
      to: fyTo(year - 1),
    },
    {
      key: "ytd",
      label: "Year to date",
      from: fyFrom(year),
      to: new Date(
        Date.UTC(year, today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999),
      ),
    },
    {
      // Wide rather than unbounded: an open range would make "as of" and the
      // month axis meaningless, and RevOptics' first deal is well inside it.
      key: "all",
      label: "All time",
      from: new Date(Date.UTC(2000, 0, 1)),
      to: fyTo(year + 5),
    },
  ];
}

export function rangeFromParams(
  params: { range?: string },
  today = new Date(),
): Range {
  const all = ranges(today);
  return all.find((r) => r.key === params.range) ?? all[0];
}

export function typesFromParams(params: { type?: string }): string[] {
  return (params.type ?? "").split(",").map((t) => t.trim()).filter(Boolean);
}

/**
 * The dashboard's own title, which names what is on screen.
 *
 * "RevOptics — All FY2026" is not decoration: it is the filter state written
 * out, and it is what somebody screenshots into a board pack. It has to stay
 * true when the filters change.
 */
export function dashboardTitle(range: Range, types: string[]): string {
  const scope = types.length === 0 ? "All" : types.join(", ");
  return `RevOptics — ${scope} ${range.label}`;
}
