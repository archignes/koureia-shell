"use client"

import type { DynamicFieldProps } from "./intake-form-types"
import { PhotoField } from "./intake-photo-field"
import { VoiceControl, VoiceNotAvailable, VoiceStatus, useVoiceField } from "./intake-voice-control"

export function DynamicField({
  field,
  value,
  onChange,
  photos,
  onAddPhoto,
  onRemovePhoto,
}: DynamicFieldProps) {
  switch (field.type) {
    case "text":
    case "email":
    case "phone":
      return <TextField field={field} value={stringValue(value)} onChange={onChange} />
    case "textarea":
      return <TextareaField field={field} value={stringValue(value)} onChange={onChange} />
    case "radio":
      return <RadioField field={field} value={stringValue(value)} onChange={onChange} />
    case "checkbox":
      return <CheckboxField field={field} value={arrayValue(value)} onChange={onChange} />
    case "select":
      return <SelectField field={field} value={stringValue(value)} onChange={onChange} />
    case "photo":
      return (
        <PhotoField
          field={field}
          photos={photos}
          textValue={stringValue(value)}
          onAdd={onAddPhoto}
          onRemove={onRemovePhoto}
          onTextChange={onChange}
          showPrivacyNotice={false}
        />
      )
    case "photo-selfie":
      return <PhotoSelfiePlaceholder field={field} />
    default:
      return null
  }
}

function TextField({
  field,
  value,
  onChange,
}: Pick<DynamicFieldProps, "field" | "value" | "onChange">) {
  const inputType = field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"
  const autoComplete =
    field.type === "email"
      ? "email"
      : field.type === "phone"
        ? "tel"
        : field.key === "name"
          ? "name"
          : undefined

  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} />
      <div className="relative">
        <input
          autoComplete={autoComplete}
          className="w-full rounded-[20px] border border-[var(--shell-border)] bg-[var(--shell-bg-elevated)] px-4 py-2.5 text-base text-[var(--shell-text)] placeholder:text-[var(--shell-text-subtle)] focus:border-[var(--shell-accent)] focus:outline-none"
          placeholder={field.placeholder}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  )
}

function TextareaField({
  field,
  value,
  onChange,
}: Pick<DynamicFieldProps, "field" | "value" | "onChange">) {
  const supportsVoice = field.key === "hair_history" || field.key === "goals"
  const voice = useVoiceField({ value: stringValue(value), onChange: (nextValue) => onChange(nextValue) })
  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} />
      {field.helpText ? <p className="text-xs leading-5 text-[var(--shell-text-subtle)]">{field.helpText}</p> : null}
      <div className="relative">
        <textarea
          className={`w-full resize-none rounded-[20px] border border-[var(--shell-border)] bg-[var(--shell-bg-elevated)] px-4 py-3 text-base text-[var(--shell-text)] placeholder:text-[var(--shell-text-subtle)] focus:border-[var(--shell-accent)] focus:outline-none ${supportsVoice ? "pr-12" : ""}`}
          placeholder={field.placeholder}
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {supportsVoice ? (
          <VoiceControl
            elapsed={voice.elapsed}
            formatDuration={voice.formatDuration}
            startRecording={voice.startRecording}
            state={voice.state}
            stopRecording={voice.stopRecording}
          />
        ) : null}
      </div>
      {supportsVoice ? (
        voice.error?.toLowerCase().includes("denied") || voice.error?.toLowerCase().includes("permission")
          ? <VoiceNotAvailable message="Microphone blocked. Allow microphone access for this site in your browser settings, then reload and try again." />
          : <VoiceStatus elapsed={voice.elapsed} error={voice.error} formatDuration={voice.formatDuration} state={voice.state} />
      ) : null}
    </div>
  )
}

function RadioField({
  field,
  value,
  onChange,
}: Pick<DynamicFieldProps, "field" | "value" | "onChange">) {
  return (
    <div className="space-y-2">
      <FieldLabel field={field} />
      {field.helpText ? <p className="text-xs leading-5 text-[var(--shell-text-subtle)]">{field.helpText}</p> : null}
      <div className="border-t border-[var(--shell-border)]">
        {field.options?.map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-center gap-3 border-b border-[var(--shell-border)] px-1 py-4 transition-colors ${
              value === option ? "text-[var(--shell-text)]" : "text-[var(--shell-text-muted)] hover:text-[var(--shell-text)]"
            }`}
            onClick={() => onChange(option)}
          >
            <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${value === option ? "border-[var(--shell-accent)]" : "border-[var(--shell-text-subtle)]"}`}>
              {value === option ? <div className="h-2 w-2 rounded-full bg-[var(--shell-accent)]" /> : null}
            </div>
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function CheckboxField({
  field,
  value,
  onChange,
}: {
  field: DynamicFieldProps["field"]
  value: string[]
  onChange: DynamicFieldProps["onChange"]
}) {
  return (
    <div className="space-y-2">
      <FieldLabel field={field} />
      {field.helpText ? <p className="text-xs leading-5 text-[var(--shell-text-subtle)]">{field.helpText}</p> : null}
      <div className="border-t border-[var(--shell-border)]">
        {field.options?.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-start gap-3 border-b border-[var(--shell-border)] px-1 py-4 text-[var(--shell-text-muted)] transition-colors hover:text-[var(--shell-text)]"
          >
            <input
              checked={value.includes(option)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--shell-border-strong)] bg-[var(--shell-bg-soft)] accent-[var(--shell-accent)]"
              type="checkbox"
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, option]
                    : value.filter((selected) => selected !== option),
                  )
              }
            />
            <span className="text-sm leading-relaxed">{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function SelectField({
  field,
  value,
  onChange,
}: Pick<DynamicFieldProps, "field" | "value" | "onChange">) {
  return (
    <div className="space-y-2">
      <FieldLabel field={field} />
      {field.helpText ? <p className="text-xs leading-5 text-[var(--shell-text-subtle)]">{field.helpText}</p> : null}
      <select
        className="w-full rounded-[22px] border border-[var(--shell-border)] bg-[var(--shell-bg-elevated)] px-4 py-3 text-base text-[var(--shell-text)] focus:border-[var(--shell-accent)] focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select...</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function PhotoSelfiePlaceholder({ field }: Pick<DynamicFieldProps, "field">) {
  return (
    <div className="space-y-2 rounded-[28px] border border-[var(--shell-border)] bg-[var(--shell-bg-elevated)] px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--shell-bg-soft)] text-[var(--shell-accent)]">
          <CameraIcon />
        </div>
        <div>
          <FieldLabel field={field} />
          <p className="text-xs leading-5 text-[var(--shell-text-subtle)]">{field.helpText ?? "Camera capture is not available in the shell yet."}</p>
        </div>
      </div>
      <button
        aria-disabled="true"
        className="rounded-full border border-[var(--shell-border)] px-4 py-2 text-sm text-[var(--shell-text-subtle)]"
        title="Camera capture coming soon"
        type="button"
      >
        Camera capture coming soon
      </button>
    </div>
  )
}

function FieldLabel({ field }: Pick<DynamicFieldProps, "field">) {
  return (
    <label className="text-sm font-medium text-[var(--shell-text)]">
      {field.label}
      {field.required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </label>
  )
}

function CameraIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M8 7.5 9.4 6h5.2L16 7.5H18A2 2 0 0 1 20 9.5v7A2 2 0 0 1 18 18.5H6a2 2 0 0 1-2-2v-7A2 2 0 0 1 6 7.5h2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function stringValue(value: DynamicFieldProps["value"]) {
  return typeof value === "string" ? value : ""
}

function arrayValue(value: DynamicFieldProps["value"]) {
  return Array.isArray(value) ? value : []
}
