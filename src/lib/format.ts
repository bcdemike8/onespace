// Money lives in integer cents everywhere; hours live in integer minutes.
// Both are only ever turned into decimals at the edge, for display.

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatMoney = (cents: number) => usd.format(cents / 100);
export const formatMoneyPrecise = (cents: number) => usdPrecise.format(cents / 100);

/** 90 → "1.5" — the decimal-hours convention every invoicing tool expects. */
export const minutesToHours = (minutes: number) =>
  Math.round((minutes / 60) * 100) / 100;

export const formatHours = (minutes: number) => {
  const hours = minutesToHours(minutes);
  return hours.toLocaleString("en-US", {
    minimumFractionDigits: hours % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

/** 90 → "1h 30m" — friendlier for a running timer. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? "-" : "";
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

/**
 * Parse whatever someone types into a duration box: "1.5", "1:30", "90m",
 * "1h30", "1h 30m", "2h". Returns minutes, or null if it makes no sense.
 */
export function parseDuration(input: string): number | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  // 1:30
  const colon = raw.match(/^(\d+):([0-5]?\d)$/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);

  // 1h30m / 1h 30 / 45m / 2h
  const hm = raw.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m?)?$/);
  if (hm && (hm[1] || hm[2])) {
    const hours = hm[1] ? Number(hm[1]) : 0;
    // A bare number with an "h" present is minutes; a bare number alone is hours.
    const rest = hm[2] ? Number(hm[2]) : 0;
    const minutes = hm[1] ? rest : rest * 60;
    return Math.round(hours * 60 + minutes);
  }

  const num = Number(raw);
  if (Number.isFinite(num)) return Math.round(num * 60);
  return null;
}

/** "$125" or "$125.50" from a typed rate, into cents. Null if unparseable. */
export function parseMoneyToCents(input: string): number | null {
  const raw = input.trim().replace(/[$,\s]/g, "");
  if (!raw) return 0;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export const centsToInput = (cents: number) => (cents / 100).toFixed(2);

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}
