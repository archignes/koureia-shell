"use client"

import React from "react"
import { useBoundProp, useStateStore } from "@json-render/react"

type PreferenceFormProps = {
  fields: string[]
  dateRangeLabel?: string
  timeWindowLabel?: string
  notesPlaceholder?: string
}

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function PreferenceForm({ fields, dateRangeLabel, timeWindowLabel, notesPlaceholder }: PreferenceFormProps) {
  const { set } = useStateStore()
  const [dateRange, setDateRange] = useBoundProp<string | undefined>(undefined, "dateRange")
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
      <label className="preference-form__field" htmlFor="preference-name">
        <span className="preference-form__label">Name <span className="preference-form__req">*</span></span>
        <input
          autoComplete="name"
          className="preference-form__input"
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
      <label className="preference-form__field" htmlFor="preference-phone">
        <span className="preference-form__label">Phone <span className="preference-form__req">*</span></span>
        <input
          autoComplete="tel"
          className="preference-form__input"
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
      <label className="preference-form__field" htmlFor="preference-email">
        <span className="preference-form__label">Email</span>
        <input
          autoComplete="email"
          className="preference-form__input"
          id="preference-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={(e) => sync("email", e.target.value)}
        />
      </label>
    ),
    dateRange: () => (
      <label className="preference-form__field" htmlFor="preference-date-range">
        <span className="preference-form__label">
          {dateRangeLabel ?? "Preferred date"}
        </span>
        <input
          className="preference-form__input"
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
      <label className="preference-form__field" htmlFor="preference-time-window">
        <span className="preference-form__label">
          {timeWindowLabel ?? "Preferred time window"}
        </span>
        <select
          className="preference-form__select"
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
    notes: () => (
      <label className="preference-form__field" htmlFor="preference-notes">
        <span className="preference-form__label">Notes <span className="preference-form__opt">(optional)</span></span>
        <textarea
          className="preference-form__textarea"
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
    <div className="preference-form">
      {fields.map((field) => (
        <React.Fragment key={field}>{fieldRenderers[field]?.()}</React.Fragment>
      ))}
    </div>
  )
}
