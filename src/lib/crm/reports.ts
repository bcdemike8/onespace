/**
 * Salesforce reports, as reports rather than as tables.
 *
 * A Salesforce report is not a list with a header. It is rows grouped one or
 * two or three deep, each group carrying its own Sum, Avg and record count,
 * and a grand total at the end - and that structure is the thing people read.
 * Flattening it into a plain table loses the answer and keeps the data.
 *
 * Both exports RevOptics sent have exactly that shape:
 *
 *   Closed Won by Month   Close Month → Type,              Sum
 *   Revenue by Type       Fiscal Period → Type → Account,  Sum and Avg
 *
 * Pure, so the grouping can be checked against those files rather than
 * against an idea of them.
 */

export interface ReportRow {
  id: string;
  amount: number;
  /** Everything the report's columns and groupings read. */
  values: Record<string, string | null>;
  /** Where clicking the row goes. */
  href?: string;
}

export interface ReportGroup {
  key: string;
  label: string;
  /** 0 for the outermost grouping. */
  level: number;
  /** Set only on the innermost level. */
  rows: ReportRow[];
  groups: ReportGroup[];
  sum: number;
  count: number;
  average: number;
}

export interface GroupLevel {
  /** The column heading Salesforce shows for this grouping. */
  label: string;
  of: (row: ReportRow) => string;
  /**
   * How the groups are ordered. Salesforce sorts a grouping ascending by
   * default, but a month grouping has to sort by date rather than by the
   * text of "1/1/2026" - which sorts before "12/1/2025".
   */
  sortKey?: (label: string, rows: ReportRow[]) => string | number;
}

const mean = (sum: number, count: number) => (count === 0 ? 0 : sum / count);

/**
 * Group rows, as deep as the levels go.
 *
 * Recursive rather than special-cased per report: two reports here want two
 * and three levels, and a third will want something else.
 */
export function group(rows: ReportRow[], levels: GroupLevel[], level = 0): ReportGroup[] {
  if (levels.length === 0) return [];

  const [current, ...rest] = levels;
  const buckets = new Map<string, ReportRow[]>();
  for (const row of rows) {
    const label = current.of(row);
    const bucket = buckets.get(label) ?? [];
    bucket.push(row);
    buckets.set(label, bucket);
  }

  const out: ReportGroup[] = [...buckets.entries()].map(([label, members]) => {
    const sum = members.reduce((s, r) => s + r.amount, 0);
    return {
      key: `${level}:${label}`,
      label,
      level,
      // Only the innermost group lists rows. An outer one that also listed
      // them would print every deal twice.
      rows: rest.length === 0 ? members : [],
      groups: rest.length === 0 ? [] : group(members, rest, level + 1),
      sum,
      count: members.length,
      average: mean(sum, members.length),
    };
  });

  const key = current.sortKey ?? ((label: string) => label);
  return out.sort((a, b) => {
    const ka = key(a.label, a.rows.length ? a.rows : flatten(a));
    const kb = key(b.label, b.rows.length ? b.rows : flatten(b));
    if (ka < kb) return -1;
    if (ka > kb) return 1;
    return 0;
  });
}

/** Every row under a group, however deep. */
export function flatten(g: ReportGroup): ReportRow[] {
  return g.rows.length ? g.rows : g.groups.flatMap(flatten);
}

export interface Total {
  sum: number;
  count: number;
  average: number;
}

export function total(rows: ReportRow[]): Total {
  const sum = rows.reduce((s, r) => s + r.amount, 0);
  return { sum, count: rows.length, average: mean(sum, rows.length) };
}

/**
 * How many rows a Salesforce report shows before it is a different kind of
 * document. The real Revenue by Type is 130 records; the cap is here so a
 * mis-set filter can't try to render 1,269 and a browser with it.
 */
export const ROW_CAP = 1000;
