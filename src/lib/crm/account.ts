/**
 * The fields Salesforce computed rather than stored.
 *
 * Formula fields aren't in an export - Salesforce works them out on the way
 * to the screen - so the bands from the field-mapping document are
 * reproduced here and computed the same way. Pure, so they can be checked
 * against the boundaries rather than eyeballed, which matters because every
 * one of these is an off-by-one waiting to happen: 50 employees is 11-50,
 * not 51-100.
 */

const EMPLOYEE_BANDS: [number, string][] = [
  [10, "1-10"],
  [50, "11-50"],
  [100, "51-100"],
  [250, "101-250"],
  [500, "251-500"],
  [1_000, "501-1,000"],
  [5_000, "1,001-5,000"],
  [10_000, "5,001-10,000"],
  [25_000, "10,001-25,000"],
  [50_000, "25,001-50,000"],
];

export function employeeRange(employees: number | null | undefined): string | null {
  if (employees === null || employees === undefined || employees < 1) return null;
  for (const [ceiling, label] of EMPLOYEE_BANDS) {
    if (employees <= ceiling) return label;
  }
  return "50,001+";
}

const REVENUE_BANDS: [number, string][] = [
  [1_000_000, "Less than $1M"],
  [10_000_000, "$1M - $10M"],
  [50_000_000, "$10M - $50M"],
  [100_000_000, "$50M - $100M"],
  [500_000_000, "$100M - $500M"],
  [1_000_000_000, "$500M - $1B"],
];

/**
 * "Less than $1M" is the band a million itself falls in, following the
 * document's own wording - the boundaries are inclusive at the top, the same
 * way the employee bands are.
 */
export function revenueRange(revenue: number | null | undefined): string | null {
  if (revenue === null || revenue === undefined || revenue <= 0) return null;
  for (const [ceiling, label] of REVENUE_BANDS) {
    if (revenue <= ceiling) return label;
  }
  return "$1B+";
}

/** An address as its lines, empty ones dropped. */
export function addressLines(parts: {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}): string[] {
  const town = [parts.city, parts.state, parts.postalCode].filter(Boolean).join(", ");
  return [parts.street, town, parts.country].filter((l): l is string => Boolean(l));
}
