/** Date and number handling shared by the CSV importers. */

/**
 * Parse the date formats these exports actually emit: ISO (`2026-09-01`,
 * optionally with a time), US `MM/DD/YYYY`, and `DD Mon YYYY`. Returns a
 * calendar day at UTC midnight, matching how the rest of the app stores dates.
 */
export function parseImportDate(value: string): Date | null {
  const raw = value.trim();
  if (!raw) return null;

  // 2026-09-01, or 2026-09-01T14:22:00Z — take the date part verbatim so a
  // timezone never shifts an entry onto the wrong day.
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  }

  // 09/01/2026 or 9/1/26 — US order, which is what both tools export.
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (us) {
    const year = Number(us[3]) < 100 ? 2000 + Number(us[3]) : Number(us[3]);
    return new Date(Date.UTC(year, Number(us[1]) - 1, Number(us[2])));
  }

  // 1 Sep 2026 / Sep 1, 2026
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  return null;
}

/** Hours as exported: "1.5", "1:30", "90m", "1h 30m". Returns minutes. */
export function parseImportHours(value: string): number | null {
  const raw = value.trim().toLowerCase().replace(/,/g, "");
  if (!raw) return null;

  const colon = raw.match(/^(\d+):([0-5]?\d)$/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);

  const hm = raw.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m)?$/);
  if (hm && (hm[1] || hm[2])) {
    return Math.round(Number(hm[1] ?? 0) * 60 + Number(hm[2] ?? 0));
  }

  const decimal = Number(raw.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(decimal) && decimal > 0) return Math.round(decimal * 60);

  return null;
}

/** "$1,234.50" → 123450 cents. Null when there's nothing numeric. */
export function parseImportMoneyCents(value: string): number | null {
  const raw = value.trim().replace(/[^0-9.-]/g, "");
  if (!raw) return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

export const truthy = (value: string) =>
  ["yes", "y", "true", "1", "billable"].includes(value.trim().toLowerCase());

/** Case- and whitespace-insensitive key for matching names across systems. */
export const matchKey = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");


/**
 * Split "Dow Jones | Outreach Implementation: (1-19)" into the end customer
 * and the service. Asana and Everhour both bury the customer in the project
 * name — after a pipe where there is one, otherwise before the first word
 * that starts the service description.
 */
const SERVICE_WORDS = ["Outreach", "Amplify", "Quick Start", "Basic Outreach", "Salesloft"];

export function splitProjectName(full: string): {
  client: string;
  service: string;
} {
  const name = full.trim();

  const pipe = name.indexOf("|");
  if (pipe > 0) {
    return {
      client: name.slice(0, pipe).trim().replace(/[-–—:]+$/, "").trim(),
      service: name.slice(pipe + 1).trim(),
    };
  }

  let cut = -1;
  for (const word of SERVICE_WORDS) {
    const at = name.indexOf(word);
    if (at > 0 && (cut === -1 || at < cut)) cut = at;
  }
  if (cut > 0) {
    return {
      client: name.slice(0, cut).trim().replace(/[-–—:]+$/, "").trim(),
      service: name.slice(cut).trim(),
    };
  }

  return { client: name, service: name };
}
