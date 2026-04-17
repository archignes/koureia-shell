"use client"

import React from "react"
import { useBoundProp, useStateStore } from "@json-render/react"

type PreferenceFormProps = {
  fields: string[]
  dateRangeLabel?: string
  dateRangePlaceholder?: string
  timeWindowLabel?: string
  notesLabel?: string
  notesPlaceholder?: string
}

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

const fieldClassName = "grid gap-[0.2rem]"
const labelClassName = "text-[0.75rem] leading-[1.3] text-[var(--shell-text-muted)]"
const inputClassName = "w-full rounded-lg border border-[var(--shell-border-strong)] bg-[var(--shell-bg-elevated)] px-3 py-2 text-[0.85rem] leading-[1.4] text-[var(--shell-text)] placeholder:text-[var(--shell-text-subtle)] focus:border-[var(--shell-accent)] focus:bg-[var(--shell-bg-soft)] focus:outline-none autofill:shadow-[inset_0_0_0_100px_var(--shell-bg-elevated)] autofill:[-webkit-text-fill-color:var(--shell-text)] autofill:caret-[var(--shell-text)]"

export function PreferenceForm({ fields, dateRangeLabel, dateRangePlaceholder, timeWindowLabel, notesLabel, notesPlaceholder }: PreferenceFormProps) {
  const { set } = useStateStore()
  const [dateRange, setDateRange] = useBoundProp<string | undefined>(undefined, "dateRange")
  const [flexibleDates, setFlexibleDates] = useBoundProp<string | undefined>(undefined, "flexibleDates")
  const [timeWindow, setTimeWindow] = useBoundProp<string | undefined>(undefined, "timeWindow")
  const [notes, setNotes] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const sync = (key: string, val: string) => set(key, val || undefined)

  const minDate = formatDateInputValue(new Date())
  const maxDateValue = new Date()
  maxDateValue.setDate(maxDateValue.getDate() + 14)
  const maxDate = formatDateInputValue(maxDateValue)

  const fieldRenderers: Record<string, () => React.ReactNode> = {
    name: () => (
      <label className={fieldClassName} htmlFor="preference-name">
        <span className={labelClassName}>Name <span className="font-semibold text-[var(--shell-accent)]">*</span></span>
        <input
          autoComplete="name"
          className={inputClassName}
          id="preference-name"
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={(e) => sync("name", e.target.value)}
        />
      </label>
    ),
    phone: () => (
      <label className={fieldClassName} htmlFor="preference-phone">
        <span className={labelClassName}>Phone <span className="font-semibold text-[var(--shell-accent)]">*</span></span>
        <input
          autoComplete="tel"
          className={inputClassName}
          id="preference-phone"
          inputMode="tel"
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={(e) => sync("phone", e.target.value)}
        />
      </label>
    ),
    email: () => (
      <label className={fieldClassName} htmlFor="preference-email">
        <span className={labelClassName}>Email</span>
        <input
          autoComplete="email"
          className={inputClassName}
          id="preference-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={(e) => sync("email", e.target.value)}
        />
      </label>
    ),
    dateRange: () => (
      <label className={fieldClassName} htmlFor="preference-date-range">
        <span className={labelClassName}>
          {dateRangeLabel ?? "Preferred date"}
        </span>
        <input
          className={inputClassName}
          id="preference-date-range"
          max={maxDate}
          min={minDate}
          type="date"
          value={dateRange ?? ""}
          onChange={(event) => setDateRange(event.target.value)}
        />
      </label>
    ),
    timeWindow: () => (
      <label className={fieldClassName} htmlFor="preference-time-window">
        <span className={labelClassName}>
          {timeWindowLabel ?? "Preferred time window"}
        </span>
        <select
          className={`${inputClassName} appearance-none`}
          id="preference-time-window"
          value={timeWindow ?? ""}
          onChange={(event) => setTimeWindow(event.target.value)}
        >
          <option value="">Select a time window</option>
          <option value="morning">Morning (before noon)</option>
          <option value="afternoon">Afternoon (noon-5pm)</option>
          <option value="evening">Evening (after 5pm)</option>
          <option value="anytime">Anytime</option>
        </select>
      </label>
    ),
    flexibleDates: () => (
      <label className={fieldClassName} htmlFor="preference-flexible-dates">
        <span className={labelClassName}>{dateRangeLabel ?? "When works for you?"}</span>
        <textarea
          className={`${inputClassName} min-h-14 resize-y`}
          id="preference-flexible-dates"
          placeholder={dateRangePlaceholder ?? "e.g., Weekday evenings, any Saturday, flexible on timing..."}
          rows={2}
          value={flexibleDates ?? ""}
          onChange={(e) => setFlexibleDates(e.target.value)}
        />
      </label>
    ),
    notes: () => (
      <label className={fieldClassName} htmlFor="preference-notes">
        <span className={labelClassName}>{notesLabel ?? "Notes"} <span className="text-[0.7rem] font-normal text-[var(--shell-text-subtle)]">(optional)</span></span>
        <textarea
          className={`${inputClassName} min-h-14 resize-y`}
          id="preference-notes"
          placeholder={notesPlaceholder ?? "Anything we should know?"}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={(e) => sync("notes", e.target.value)}
        />
      </label>
    ),
  }

  return (
    <div className="mt-4 grid snap-start scroll-mt-2 gap-[0.6rem] rounded-xl border border-[var(--shell-border)] bg-[rgba(228,231,239,0.02)] p-3">
      {fields.map((field) => (
        <React.Fragment key={field}>{fieldRenderers[field]?.()}</React.Fragment>
      ))}
    </div>
  )
}
