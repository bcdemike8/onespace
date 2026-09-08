/**
 * Everything name- and identity-related, in one place.
 *
 * Colours live in `src/app/globals.css` under the "Brand palette" block —
 * they have to be CSS custom properties so Tailwind can generate utilities
 * from them, so they can't be imported from here.
 */
export const BRAND = {
  /** Full name — browser tab, login screen, page metadata. */
  name: "RevOptics OneSpace",
  /** Short name for tight spots like the sidebar. */
  shortName: "OneSpace",
  /** The letter or two in the square logo tile. */
  mark: "RO",
  tagline: "Projects, tasks and hours in one place.",
  description:
    "Templated projects, task tracking and billable time for RevOptics.",
} as const;
