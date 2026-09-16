import Link from "next/link";

/**
 * The parts a Salesforce-shaped record page is made of.
 *
 * Four pages now use these - account, deal, contact, opportunity product -
 * and until this file existed each carried its own copy. Three copies is
 * where a "—" on one page starts being an empty string on another, and where
 * a spacing fix lands on two pages out of four.
 *
 * Two kinds of section, because Salesforce laid out both:
 *
 *   Section  fills across, left-right-left-right. Right when the two columns
 *            hold roughly the same number of fields.
 *   Columns  fills down the left, then down the right. Necessary when they
 *            don't: a contact's nine-against-three would otherwise pair
 *            Title with Contact Owner and interleave the rest into nonsense.
 */

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card mb-4 p-5">
      <SectionTitle>{title}</SectionTitle>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export function Columns({
  title,
  left,
  right,
}: {
  title: string;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <section className="card mb-4 p-5">
      <SectionTitle>{title}</SectionTitle>
      <div className="grid gap-x-8 sm:grid-cols-2">
        <dl className="space-y-3">{left}</dl>
        <dl className="space-y-3">{right}</dl>
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b border-ink-100 pb-2 text-sm font-medium text-ink-900">
      {children}
    </h2>
  );
}

/**
 * One field, shown even when it is empty.
 *
 * The blank is the point. A record page is a list of what is known and what
 * isn't, and a field that disappears when unfilled can never be noticed as
 * missing - the unbilled invoice, the audit nobody booked, the manager
 * nobody recorded.
 */
export function Field({
  label,
  value,
  note,
  href,
  mailto,
  tel,
  wide,
}: {
  label: string;
  value?: string | null;
  note?: string | null;
  href?: string;
  mailto?: string;
  tel?: string;
  wide?: boolean;
}) {
  const shown = value && value.trim() !== "" ? value : null;
  const external = mailto ? `mailto:${mailto}` : tel ? `tel:${tel}` : null;

  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd
        className={`text-sm whitespace-pre-line ${shown ? "text-ink-900" : "text-ink-300"}`}
      >
        {!shown ? (
          "—"
        ) : href ? (
          <Link href={href} className="underline">
            {shown}
          </Link>
        ) : external ? (
          <a href={external} className="underline">
            {shown}
          </a>
        ) : (
          shown
        )}
        {shown && note ? (
          <span className="block text-xs text-ink-500">{note}</span>
        ) : null}
      </dd>
    </div>
  );
}

/** A related list, down the right-hand side. Honest about being empty. */
export function Related({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4">
      <h2 className="mb-1 text-sm font-medium text-ink-900">
        {title} <span className="text-ink-400">({count})</span>
      </h2>
      {count === 0 ? (
        <p className="text-sm text-ink-400">None.</p>
      ) : (
        <ul className="divide-y divide-ink-100">{children}</ul>
      )}
    </section>
  );
}

/** One number in the strip under a record's title. */
export function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-sm font-medium text-ink-900">{value}</p>
    </div>
  );
}
