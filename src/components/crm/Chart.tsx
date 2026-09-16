import type { Bucket, Stack } from "@/lib/crm/report";

/**
 * Charts, in plain SVG.
 *
 * No charting library: this is bars against a baseline, and a dependency for
 * that would be a sixth vendor to keep current for the sake of arithmetic
 * already done in report.ts.
 *
 * The specs are fixed and deliberate - bars capped at 24px so the band keeps
 * its air, a 4px rounded top with a square foot on the baseline, a 2px gap in
 * the surface colour separating touching segments instead of a stroke around
 * them, and a hairline solid grid one step off the surface. Every chart also
 * has its numbers written out beneath it, because three of the four series
 * colours sit under 3:1 against this background and a colour nobody can see
 * is not an encoding.
 */

/** Validated against the page surface: see the palette check in the notes. */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"] as const;

const SURFACE = "#ffffff";
const GRID = "#e7e7e4";
const BAR_MAX = 24;
const GAP = 2;

/** Room on the left for the y-axis ticks, which carry the unlabelled values. */
const WIDTH = 560;
const AXIS = 44;
const PLOT = WIDTH - AXIS;

const compact = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};

/** Round the top of the scale to something a person would choose. */
function ceiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * magnitude;
    if (candidate >= max) return candidate;
  }
  return 10 * magnitude;
}

/**
 * One series against a baseline. No legend: there is only one colour, and
 * the heading already says what is plotted.
 */
export function Columns({
  data,
  height = 180,
  label,
}: {
  data: Bucket[];
  height?: number;
  label?: (b: Bucket) => string;
}) {
  if (data.length === 0) {
    return <p className="p-4 text-sm text-ink-500">Nothing closed in this period.</p>;
  }

  const top = ceiling(Math.max(...data.map((d) => d.amount)));
  const band = 100 / data.length;
  const barWidth = Math.min(BAR_MAX, (band / 100) * PLOT * 0.6);

  // Labelled selectively, not on every column: a value above every bar is
  // chaos and goes unread. The peak and the most recent period are the two
  // anyone looks for; the axis ticks and the table carry the rest.
  const peak = data.reduce((best, d) => (d.amount > best.amount ? d : best), data[0]);
  const latest = [...data].reverse().find((d) => d.amount > 0);
  const labelled = new Set([peak?.key, latest?.key].filter(Boolean));

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${height + 34}`}
        className="w-full"
        role="img"
        aria-label="Closed business, by period"
      >
        <Grid top={top} height={height} />

        {data.map((d, i) => {
          const centre = AXIS + (i + 0.5) * (PLOT / data.length);
          const h = top > 0 ? (d.amount / top) * (height - 18) : 0;
          return (
            <g key={d.key}>
              {/* 4px rounded cap, square foot: a rect with a rounded top is
                  drawn as a path so the baseline stays flat. */}
              {h > 0 ? (
                <path
                  d={barPath(centre - barWidth / 2, height - h, barWidth, h, 4)}
                  fill={SERIES[0]}
                >
                  <title>{`${d.label}: ${compact(d.amount)} across ${d.count} deals`}</title>
                </path>
              ) : null}
              {d.amount > 0 && labelled.has(d.key) ? (
                <text
                  x={centre}
                  y={height - h - 6}
                  textAnchor="middle"
                  className="fill-ink-700"
                  style={{ fontSize: 10, fontWeight: 500 }}
                >
                  {label ? label(d) : compact(d.amount)}
                </text>
              ) : null}
              <text
                x={centre}
                y={height + 16}
                textAnchor="middle"
                className="fill-ink-500"
                style={{ fontSize: 10 }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/**
 * Three hairline rules and their values.
 *
 * Solid, one step off the surface, and recessive. They exist so the columns
 * don't each need a number written over them - the two that are labelled are
 * labelled because they are worth pointing at, not because the reader has no
 * other way to get a value.
 */
function Grid({ top, height }: { top: number; height: number }) {
  return (
    <g>
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line
            x1={AXIS}
            x2={WIDTH}
            y1={height - t * (height - 18)}
            y2={height - t * (height - 18)}
            stroke={GRID}
            strokeWidth={1}
          />
          <text
            x={AXIS - 8}
            y={height - t * (height - 18) + 3}
            textAnchor="end"
            className="fill-ink-400"
            style={{ fontSize: 9 }}
          >
            {t === 0 ? "0" : compact(top * t)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** A bar with a rounded top and a flat foot on the baseline. */
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, h, w / 2);
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h}`,
    "Z",
  ].join(" ");
}

/**
 * Years on the x-axis, one dimension stacked within each.
 *
 * Series order is fixed by the caller and identical in every band, so a
 * colour means the same thing across the chart and filtering never repaints
 * the survivors.
 */
export function StackedColumns({
  data,
  series,
  height = 200,
}: {
  data: Stack[];
  series: string[];
  height?: number;
}) {
  if (data.length === 0) {
    return <p className="p-4 text-sm text-ink-500">Nothing closed in this period.</p>;
  }

  const top = ceiling(Math.max(...data.map((d) => d.total)));
  const barWidth = Math.min(BAR_MAX, (PLOT / data.length) * 0.5);

  const peak = data.reduce((best, d) => (d.total > best.total ? d : best), data[0]);
  const latest = [...data].reverse().find((d) => d.total > 0);
  const labelled = new Set([peak?.label, latest?.label].filter(Boolean));

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${height + 34}`}
        className="w-full"
        role="img"
        aria-label="Closed business by year, split by series"
      >
        <Grid top={top} height={height} />

        {data.map((band, i) => {
          const centre = AXIS + (i + 0.5) * (PLOT / data.length);
          let cursor = height;
          const drawn = band.parts
            .map((part, s) => {
              if (part.amount <= 0) return null;
              const h = (part.amount / top) * (height - 18);
              const y = cursor - h;
              cursor = y - GAP; // the surface gap, not a stroke
              return (
                <path
                  key={part.series}
                  d={barPath(centre - barWidth / 2, y, barWidth, h, 4)}
                  fill={SERIES[s % SERIES.length]}
                >
                  <title>{`${band.label} · ${part.series}: ${compact(part.amount)}`}</title>
                </path>
              );
            })
            .filter(Boolean);

          return (
            <g key={band.label}>
              {drawn}
              {band.total > 0 && labelled.has(band.label) ? (
                <text
                  x={centre}
                  y={cursor - 6}
                  textAnchor="middle"
                  className="fill-ink-700"
                  style={{ fontSize: 10, fontWeight: 500 }}
                >
                  {compact(band.total)}
                </text>
              ) : null}
              <text
                x={centre}
                y={height + 16}
                textAnchor="middle"
                className="fill-ink-500"
                style={{ fontSize: 10 }}
              >
                {band.label}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
        {series.map((s, i) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: SERIES[i % SERIES.length] }}
            />
            {s}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/** The numbers, in full. Not a fallback — the chart's other half. */
export function Figures({
  rows,
  total,
  unit = "deals",
}: {
  rows: Bucket[];
  total?: number;
  unit?: string;
}) {
  const sum = total ?? rows.reduce((s, r) => s + r.amount, 0);
  return (
    <table className="mt-3 w-full text-sm">
      <tbody className="divide-y divide-ink-100">
        {rows.map((r) => (
          <tr key={r.key}>
            <td className="py-1.5 pr-2 text-ink-700">{r.label}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-ink-500">
              {r.count} {unit}
            </td>
            <td className="py-1.5 text-right tabular-nums font-medium text-ink-900">
              ${Math.round(r.amount).toLocaleString()}
            </td>
            <td className="w-12 py-1.5 pl-2 text-right tabular-nums text-ink-400">
              {sum > 0 ? `${Math.round((r.amount / sum) * 100)}%` : ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export { compact };
