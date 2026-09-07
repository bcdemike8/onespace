"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that disables itself while its form action is in flight.
 * Double-submitting a time entry is the kind of bug that quietly corrupts a
 * month of billing, so every mutating form uses this.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "btn-primary",
  ...rest
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  return (
    <button {...rest} type="submit" disabled={pending} className={className}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}
