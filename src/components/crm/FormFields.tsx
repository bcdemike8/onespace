import { Columns, Section } from "@/components/crm/Record";

/**
 * The edit side of a record page.
 *
 * Deliberately the same shapes as the read side - Section fills across,
 * Columns fills down each column in turn - so that pressing Edit changes the
 * fields into inputs and moves nothing. A form that rearranges the page it
 * came from makes people hunt for the field they came to change.
 *
 * Server components: no state, no client bundle. Every one of these is a
 * plain input in a plain form, which is also why an edit page works with a
 * flaky connection and a slow laptop.
 */

export { Columns as FormColumns, Section as FormSection };

interface Base {
  label: string;
  name: string;
  hint?: string;
  wide?: boolean;
  required?: boolean;
}

function Wrap({
  label,
  name,
  hint,
  wide,
  required,
  children,
}: Base & { children: React.ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label className="label" htmlFor={name}>
        {label}
        {required ? <span className="text-bad-600"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  value,
  type = "text",
  placeholder,
  ...base
}: Base & { value?: string | null; type?: string; placeholder?: string }) {
  return (
    <Wrap {...base}>
      <input
        id={base.name}
        name={base.name}
        type={type}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        required={base.required}
        className="input"
      />
    </Wrap>
  );
}

export function TextBox({
  value,
  rows = 3,
  ...base
}: Base & { value?: string | null; rows?: number }) {
  return (
    <Wrap {...base} wide={base.wide ?? true}>
      <textarea
        id={base.name}
        name={base.name}
        rows={rows}
        defaultValue={value ?? ""}
        className="input"
      />
    </Wrap>
  );
}

export function DateInput({ value, ...base }: Base & { value?: string | null }) {
  return <TextInput {...base} type="date" value={value} />;
}

export function NumberInput({
  value,
  step,
  ...base
}: Base & { value?: string | number | null; step?: string }) {
  return (
    <Wrap {...base}>
      <input
        id={base.name}
        name={base.name}
        type="text"
        inputMode="decimal"
        defaultValue={value === null || value === undefined ? "" : String(value)}
        className="input"
        data-step={step}
      />
    </Wrap>
  );
}

export interface Option {
  value: string;
  label: string;
  /** Optional heading to sit under. Options with none come first, ungrouped. */
  group?: string;
}

/**
 * A dropdown over a relation.
 *
 * Plain options, even for the 1,037 accounts: about 40KB of markup, which
 * loads once and then filters by typing in every browser, against a
 * type-ahead of our own that would need JavaScript, a request per keystroke,
 * and a decision about what happens when the network is slow.
 *
 * The empty option is how a relation is cleared, so it is always present
 * unless the field is genuinely required.
 */
export function Select({
  value,
  options,
  empty = "— none —",
  ...base
}: Base & { value?: string | null; options: Option[]; empty?: string | null }) {
  return (
    <Wrap {...base}>
      <select
        id={base.name}
        name={base.name}
        defaultValue={value ?? ""}
        className="input"
      >
        {empty === null ? null : <option value="">{empty}</option>}
        {options
          .filter((o) => !o.group)
          .map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        {/* Grouped options keep their heading, so a retired product is
            offered and labelled rather than hidden. Hiding it is what
            stops an old deal being recorded at all. */}
        {[...new Set(options.map((o) => o.group).filter(Boolean))].map((g) => (
          <optgroup key={g} label={g as string}>
            {options
              .filter((o) => o.group === g)
              .map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </Wrap>
  );
}

export function Check({
  value,
  ...base
}: Omit<Base, "required"> & { value?: boolean }) {
  return (
    <div className={base.wide ? "sm:col-span-2" : undefined}>
      <label className="flex items-start gap-2 text-sm text-ink-900" htmlFor={base.name}>
        <input
          id={base.name}
          name={base.name}
          type="checkbox"
          defaultChecked={value ?? false}
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200"
        />
        <span>
          {base.label}
          {base.hint ? (
            <span className="block text-xs text-ink-500">{base.hint}</span>
          ) : null}
        </span>
      </label>
    </div>
  );
}

/** A comma-separated list, shown as one. */
export function ListInput({
  value,
  ...base
}: Base & { value?: string[] | null }) {
  return (
    <TextInput
      {...base}
      value={(value ?? []).join(", ")}
      hint={base.hint ?? "Separate them with commas."}
    />
  );
}
