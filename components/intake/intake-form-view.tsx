"use client"

import Link from "next/link"

import { DynamicField } from "./intake-form-fields"
import type { IntakePageViewProps } from "./intake-form-types"

export function LoadingState() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--shell-bg)]">
      <SpinnerIcon className="h-6 w-6 animate-spin text-[var(--shell-accent)]" />
    </div>
  )
}

export function ErrorState({ error, href }: { error: string; href: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--shell-bg)] px-4">
      <div className="max-w-sm space-y-3 rounded-[28px] border border-[var(--shell-border)] bg-[var(--shell-bg-elevated)]/92 px-6 py-8 text-center shadow-[var(--shell-shadow)]">
        <p className="text-sm text-[var(--shell-text-muted)]">{error}</p>
        <Link className="text-sm font-medium text-[var(--shell-accent)] hover:text-[var(--shell-accent-strong)]" href={href}>
          Go back
        </Link>
      </div>
    </div>
  )
}

export function SuccessState({
  formTitle,
  photoCount,
  href,
}: {
  formTitle: string
  photoCount: number
  href: string
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--shell-bg)] px-4">
      <div className="max-w-sm space-y-4 rounded-[32px] border border-[var(--shell-border-strong)] bg-[var(--shell-bg-elevated)]/96 px-6 py-8 text-center shadow-[var(--shell-shadow)]">
        <SuccessIcon />
        <h1 className="text-3xl text-[var(--shell-text)]" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>
          You&apos;re all set
        </h1>
        <p className="text-sm leading-6 text-[var(--shell-text-muted)]">
          We&apos;ve received your {formTitle}. Your stylist will review it before your appointment.
        </p>
        {photoCount > 0 ? (
          <p className="text-xs text-[var(--shell-text-subtle)]">
            {photoCount} photo{photoCount > 1 ? "s" : ""} uploaded
          </p>
        ) : null}
        <Link className="inline-flex rounded-full bg-[var(--shell-accent)] px-4 py-2 text-sm font-semibold text-[var(--shell-accent-contrast)]" href={href}>
          Back to site
        </Link>
      </div>
    </div>
  )
}

export function IntakePageView({
  activeIndex,
  answers,
  canSubmit,
  error,
  form,
  hasStarted,
  missingFields,
  tenantName,
  photosByField,
  sections,
  submitting,
  totalSections,
  scrollRef,
  sectionRefs,
  addPhoto,
  removePhoto,
  clearDraft,
  handleSubmit,
  scrollTo,
  setAnswer,
}: IntakePageViewProps) {
  const hasDraft = Object.keys(answers).length > 0 || Object.keys(photosByField).length > 0
  const showHourlyNotice = form.form_type === "new-client-cassie" || form.form_type === "new-client"
  const showSubmitPanel = canSubmit || hasStarted || Boolean(error)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--shell-bg)] text-[var(--shell-text)]">
      <div className="shrink-0 border-b border-[var(--shell-border)] bg-[var(--shell-bg)]/95 px-4 pb-2 pt-2 backdrop-blur-sm">
        <div className="mx-auto max-w-md space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--shell-border)] bg-[var(--shell-bg-soft)] text-[var(--shell-accent)] shadow-inner">
              <SparklesIcon />
            </div>
            <div className="min-w-0 flex-1">
              {form.linkedClient ? (
                <>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--shell-accent)]/80">{tenantName}</p>
                  <p className="truncate text-lg font-bold leading-tight text-[var(--shell-text)]">{form.title} for {form.linkedClient.displayName}</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--shell-accent)]/80">Welcome to</p>
                  <p className="truncate text-[1.45rem] leading-none text-[var(--shell-text)]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {tenantName}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-[var(--shell-text-muted)]">{form.title}</p>
                </>
              )}
            </div>
            {hasDraft ? (
              <button
                className="text-[11px] font-medium text-[var(--shell-text-subtle)] transition-colors hover:text-[var(--shell-text)]"
                onClick={clearDraft}
                type="button"
              >
                Start over
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            {sections.map((section, index) => (
              <button
                key={section.id}
                className="flex flex-1 flex-col items-center gap-1"
                onClick={() => scrollTo(index)}
                type="button"
              >
                <div className={`h-1 w-full rounded-full transition-all ${index < activeIndex ? "bg-[var(--shell-accent)]" : index === activeIndex ? "bg-[var(--shell-accent)]/50" : "bg-[var(--shell-border-strong)]"}`} />
                <span className={`text-[9px] transition-colors ${index === activeIndex ? "text-[var(--shell-accent)]" : "text-[var(--shell-text-subtle)]"}`}>
                  {section.label}
                </span>
              </button>
            ))}
            <button
              className="flex flex-1 flex-col items-center gap-1"
              onClick={() => scrollTo(totalSections - 1)}
              type="button"
            >
              <div className={`h-1 w-full rounded-full transition-all ${activeIndex >= sections.length ? "bg-[var(--shell-accent)]/50" : "bg-[var(--shell-border-strong)]"}`} />
              <span className={`text-[9px] transition-colors ${activeIndex >= sections.length ? "text-[var(--shell-accent)]" : "text-[var(--shell-text-subtle)]"}`}>
                Submit
              </span>
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth">
        {sections.map((section, index) => (
          <div
            key={section.id}
            ref={(element) => {
              sectionRefs.current[index] = element
            }}
            className="snap-start flex min-h-[calc(100dvh-112px)] flex-col justify-start px-4 py-3"
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) return

              if (event.target instanceof HTMLInputElement) {
                event.preventDefault()
                scrollTo(Math.min(index + 1, totalSections - 1))
                return
              }

              if (event.target instanceof HTMLTextAreaElement) {
                event.preventDefault()
                scrollTo(Math.min(index + 1, totalSections - 1))
              }
            }}
          >
            <div className="mx-auto w-full max-w-md space-y-4">
              {section.fields.length > 1 ? (
                <>
                  <h2 className="text-[1.75rem] leading-tight text-[var(--shell-text)]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {section.id === "contact" ? "Let’s start with the basics:" : section.label}
                  </h2>
                  {index === 0 && form.description ? (
                    <p className="max-w-md text-xs leading-5 text-[var(--shell-text-muted)]">
                      {form.description}
                    </p>
                  ) : null}
                </>
              ) : null}
              {section.fields.map((field) => (
                <DynamicField
                  key={field.key}
                  field={field}
                  photos={photosByField[field.key] ?? []}
                  value={answers[field.key] ?? ""}
                  onAddPhoto={(file) => addPhoto(field.key, file)}
                  onChange={(value) => setAnswer(field.key, value)}
                  onRemovePhoto={(photoIndex) => removePhoto(field.key, photoIndex)}
                />
              ))}
              {section.fields.some((field) => field.type === "textarea") ? (
                <p className="text-[11px] text-[var(--shell-text-subtle)]">
                  Press `Enter` to continue. Use `Shift+Enter` for a new line.
                </p>
              ) : null}
              {section.id === "photos" ? (
                <div className="flex items-start gap-1.5 pt-1">
                  <LockIcon />
                  <p className="text-[10px] text-[var(--shell-text-subtle)]">
                    Photos are shared only with your stylist and used for consultation purposes only.
                  </p>
                </div>
              ) : null}
              {index < sections.length - 1 ? (
                <div className="pt-1">
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--shell-border)] px-4 text-xs font-medium text-[var(--shell-text-muted)] transition-colors hover:border-[var(--shell-accent)]/55 hover:text-[var(--shell-text)]"
                    onClick={() => scrollTo(index + 1)}
                    type="button"
                  >
                    Next →
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {showSubmitPanel ? (
          <div
            ref={(element) => {
              sectionRefs.current[sections.length] = element
            }}
            className="snap-start flex min-h-[calc(100dvh-112px)] flex-col items-center justify-start px-4 py-5"
          >
            <div className="mx-auto w-full max-w-md space-y-4 rounded-[32px] border border-[var(--shell-border-strong)] bg-[var(--shell-bg-elevated)]/96 px-6 py-7 shadow-[var(--shell-shadow)]">
              {canSubmit ? (
                <>
                  <h2 className="text-3xl text-[var(--shell-text)]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Ready to submit?
                  </h2>
                  <p className="text-sm leading-6 text-[var(--shell-text-muted)]">
                    We&apos;ll review your consultation before your appointment.
                  </p>
                </>
              ) : hasStarted ? (
                <>
                  <h2 className="text-2xl text-[var(--shell-text)]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Finish the required fields
                  </h2>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-red-400">Complete these before you submit:</p>
                    <div className="flex flex-wrap gap-2">
                      {missingFields.map((field) => (
                        <button
                          key={field.key}
                          className="rounded-full border border-red-900/40 bg-red-950/30 px-3 py-1 text-xs text-red-300 hover:border-red-700/60"
                          onClick={() => scrollTo(field.sectionIndex)}
                          type="button"
                        >
                          {field.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {error ? <p className="text-xs text-red-400">{error}</p> : null}

              {canSubmit ? (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[var(--shell-accent)] px-4 py-3 text-sm font-semibold text-[var(--shell-accent-contrast)] transition-colors hover:bg-[var(--shell-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={submitting}
                  onClick={handleSubmit}
                  type="button"
                >
                  {submitting ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : null}
                  Submit {form.title}
                </button>
              ) : null}
              {showHourlyNotice ? (
                <p className="rounded-[20px] border border-[var(--shell-border)] bg-[var(--shell-bg-soft)] px-4 py-3 text-xs leading-5 text-[var(--shell-text-muted)]">
                  Notice: My services are hourly. $150/hour for time used (gratuity included).
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {canSubmit ? (
        <div className="sticky bottom-0 z-20 border-t border-[var(--shell-border)] bg-[var(--shell-bg)]/96 px-4 py-3 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--shell-accent)]/80">Mobile submit</p>
            <p className="text-sm text-[var(--shell-text-muted)]">Keep this handy while you review your answers.</p>
          </div>
          <button
            className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[18px] bg-[var(--shell-accent)] px-5 text-sm font-semibold text-[var(--shell-accent-contrast)] shadow-[0_16px_36px_-20px_rgba(199,164,106,0.55)] transition-colors hover:bg-[var(--shell-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            type="button"
          >
            {submitting ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : null}
            Submit {form.title}
          </button>
        </div>
        </div>
      ) : null}
    </div>
  )
}

function SparklesIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3ZM18.5 15l.8 2 .7.3-2 .8-.8 2-.8-2-2-.8 2-.8.8-2ZM6 15l1 2.5 2.5 1L7 19.5 6 22l-1-2.5-2.5-1L5 17.5 6 15Z" fill="currentColor" />
    </svg>
  )
}

function SuccessIcon() {
  return (
    <svg aria-hidden="true" className="mx-auto h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24">
      <path d="M7 12.5 10 15.5 17 8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function SpinnerIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" opacity="0.2" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 text-[var(--shell-text-subtle)]" fill="none" viewBox="0 0 24 24">
      <path d="M8 10V7a4 4 0 1 1 8 0v3m-9 0h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}
