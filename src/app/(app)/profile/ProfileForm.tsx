"use client";

import { useActionState, useState } from "react";
import { MONTHS, WORK_DAYS, daysInMonth } from "@/lib/profile";
import { updateProfileAction } from "@/app/actions/profile";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export interface ProfileValues {
  name: string;
  title: string;
  phone: string;
  linkedin: string;
  timeZone: string;
  startDate: string;
  workStart: string;
  workEnd: string;
  workDays: number[];
  birthdayMonth: string;
  birthdayDay: string;
}

/**
 * One form for everything somebody can say about themselves.
 *
 * A client component only so the error from the action can sit next to the
 * button that caused it — the fields themselves are plain inputs, and it
 * works with JavaScript still loading.
 */
export function ProfileForm({
  values,
  zones,
}: {
  values: ProfileValues;
  zones: { value: string; label: string }[];
}) {
  const [state, action] = useActionState(updateProfileAction, {});

  // The day list follows the month, so February never offers a 30th. The
  // server checks the pair anyway — this is so nobody has to be told.
  const [month, setMonth] = useState(values.birthdayMonth);
  const days = daysInMonth(Number(month)) || 31;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={values.name}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={values.title}
            placeholder="RevOps Consultant"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={values.phone}
            placeholder="(312) 555-0142"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="linkedin">
            LinkedIn
          </label>
          <input
            id="linkedin"
            name="linkedin"
            defaultValue={values.linkedin}
            placeholder="linkedin.com/in/your-name"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="startDate">
            Started here
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={values.startDate}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="birthdayMonth">
            Birthday
          </label>
          <div className="flex gap-2">
            <select
              id="birthdayMonth"
              name="birthdayMonth"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input"
            >
              <option value="">Month</option>
              {MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              aria-label="Day of the month you were born"
              name="birthdayDay"
              defaultValue={values.birthdayDay}
              className="input w-28"
            >
              <option value="">Day</option>
              {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-ink-500">No year — just the day.</p>
        </div>

        <div>
          <label className="label" htmlFor="timeZone">
            Time zone
          </label>
          <select
            id="timeZone"
            name="timeZone"
            defaultValue={values.timeZone}
            className="input"
          >
            <option value="">Not set</option>
            {zones.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="label">Working hours</legend>
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Start of your working day"
            name="workStart"
            type="time"
            defaultValue={values.workStart}
            className="input w-auto"
          />
          <span className="text-sm text-ink-500">to</span>
          <input
            aria-label="End of your working day"
            name="workEnd"
            type="time"
            defaultValue={values.workEnd}
            className="input w-auto"
          />
        </div>
        <p className="mt-1 text-xs text-ink-500">
          In your own time zone. This is what colleagues see before they message
          you — it doesn&rsquo;t change when anything is sent.
        </p>
      </fieldset>

      <fieldset>
        <legend className="label">Working days</legend>
        <div className="flex flex-wrap gap-1.5">
          {WORK_DAYS.map((day) => (
            <label
              key={day.value}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-300 px-2.5 py-1.5 text-sm text-ink-700 hover:bg-ink-50 has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-900"
            >
              <input
                type="checkbox"
                name="workDays"
                value={day.value}
                defaultChecked={values.workDays.includes(day.value)}
                className="accent-brand-600"
              />
              <span aria-hidden>{day.short}</span>
              <span className="sr-only">{day.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <ErrorNote message={state.error} />
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
        {state.ok ? (
          <span className="text-sm text-good-700">Saved.</span>
        ) : null}
      </div>
    </form>
  );
}
