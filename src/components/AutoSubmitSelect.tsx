"use client";

/** A <select> inside a form that posts the moment the value changes. */
export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  ariaLabel,
  className = "input",
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <select
      name={name}
      aria-label={ariaLabel}
      defaultValue={defaultValue}
      className={className}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
