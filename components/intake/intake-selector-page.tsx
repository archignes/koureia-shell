import Link from "next/link"

import type { IntakeFormSummary } from "@/lib/intake"

export function IntakeSelectorPage({
  forms,
  tenantName,
  baseHref,
}: {
  forms: IntakeFormSummary[]
  tenantName: string
  baseHref: string
}) {
  const isNewClientForm = (formType: string) => formType.startsWith("new-client")

  if (forms.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--shell-bg)] px-4 text-center">
        <p className="max-w-sm text-sm text-[var(--shell-text-muted)]">No intake forms are available for this shop right now.</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[var(--shell-bg)] px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--shell-accent)]/80">Beauty and care</p>
          <h1 className="text-4xl leading-tight text-[var(--shell-text)] sm:text-5xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Welcome to {tenantName}
          </h1>
          <p className="mx-auto max-w-md text-base leading-7 text-[var(--shell-text-muted)]">
            Choose the intake that best matches your visit. We’ll keep it simple, warm, and easy to complete on your phone.
          </p>
        </div>

        <div className="space-y-3">
          {forms.map((form) => (
            <Link
              key={form.id}
              className="group relative block overflow-hidden rounded-[28px] border px-5 py-5 transition-all duration-300 hover:-translate-y-0.5"
              href={`${baseHref}/${form.form_type}`}
              style={{
                borderColor: isNewClientForm(form.form_type) ? "rgba(199, 164, 106, 0.65)" : "var(--shell-border)",
                boxShadow: isNewClientForm(form.form_type) ? "0 24px 60px -30px rgba(199, 164, 106, 0.42)" : "var(--shell-shadow)",
                background: isNewClientForm(form.form_type)
                  ? "linear-gradient(180deg, rgba(26, 32, 43, 0.98) 0%, rgba(21, 25, 34, 0.98) 100%)"
                  : "rgba(21, 25, 34, 0.92)",
              }}
            >
              {isNewClientForm(form.form_type) ? (
                <>
                  <div className="pointer-events-none absolute inset-x-10 top-0 h-12 rounded-full bg-[var(--shell-accent)]/35 blur-2xl animate-[pulse_2.6s_ease-in-out_infinite]" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[radial-gradient(circle_at_top_right,rgba(199,164,106,0.22),transparent_65%)]" />
                </>
              ) : null}
              <div className="relative flex items-center gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full border border-[var(--shell-border)] ${isNewClientForm(form.form_type) ? "bg-[var(--shell-accent)]/15 text-[var(--shell-accent)]" : "bg-[var(--shell-bg-soft)] text-[var(--shell-accent)]"}`}>
                  <ClipboardIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-[var(--shell-text)]">{form.title}</h2>
                    {isNewClientForm(form.form_type) ? (
                      <span className="rounded-full bg-[var(--shell-accent)]/18 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--shell-accent)]">
                        New
                      </span>
                    ) : null}
                  </div>
                  {form.description ? (
                    <p className="line-clamp-2 text-sm leading-6 text-[var(--shell-text-muted)]">{form.description}</p>
                  ) : null}
                  {isNewClientForm(form.form_type) ? (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-[var(--shell-accent)]/85">
                      Personalized luxury prep
                    </p>
                  ) : null}
                </div>
                <ChevronRightIcon />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function ClipboardIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <rect height="16" rx="2" stroke="currentColor" strokeWidth="1.8" width="12" x="6" y="5" />
      <rect height="3" rx="1" stroke="currentColor" strokeWidth="1.8" width="6" x="9" y="2.5" />
      <path d="M9.5 10.5h5M9.5 14h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 text-[var(--shell-text-subtle)] transition-colors group-hover:text-[var(--shell-accent)]" fill="none" viewBox="0 0 24 24">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}
