"use client"

import { useStateBinding } from "@json-render/react"

type BookingModeItem = {
  mode: "after-hours" | "home-service"
  label: string
  description: string
  price: string
  serviceId: string
}

type BookingModeButtonsProps = {
  modes: BookingModeItem[]
}

const MODE_ICONS: Record<string, string> = {
  "after-hours": "\u{1F319}",
  "home-service": "\u{1F3E0}",
}

const MODE_HREFS: Record<string, string> = {
  "after-hours": "../after-hours",
}

export function BookingModeButtons({ modes }: BookingModeButtonsProps) {
  const [, setSelectedServiceId] = useStateBinding<string | undefined>("selectedServiceId")

  return (
    <div className="mt-3">
      <p className="mb-[0.35rem] block w-full border-b border-[var(--shell-border)] pb-[0.25rem] text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-[var(--shell-text-muted)]">
        Special bookings
      </p>
      <div className="grid gap-2">
        {modes.map((m) => {
          const href = MODE_HREFS[m.mode]

          if (href) {
            return (
              <a
                key={m.mode}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-[var(--shell-border)] bg-[rgba(228,231,239,0.03)] px-4 py-3 no-underline transition-[background,border-color] duration-150 ease-[var(--shell-transition)] hover:border-[var(--shell-accent)] hover:bg-[rgba(199,164,106,0.08)]"
              >
                <span className="text-xl" aria-hidden="true">
                  {MODE_ICONS[m.mode]}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[0.9rem] font-semibold text-[var(--shell-text)]">
                    {m.label}
                  </span>
                  <span className="text-[0.8rem] text-[var(--shell-text-muted)]">
                    {m.description}
                  </span>
                </span>
                <span className="shrink-0 text-[0.85rem] font-semibold tabular-nums text-[var(--shell-accent)]">
                  {m.price}
                </span>
              </a>
            )
          }

          return (
            <button
              key={m.mode}
              type="button"
              className="flex items-center gap-3 rounded-xl border border-[var(--shell-border)] bg-[rgba(228,231,239,0.03)] px-4 py-3 text-left transition-[background,border-color] duration-150 ease-[var(--shell-transition)] hover:border-[var(--shell-accent)] hover:bg-[rgba(199,164,106,0.08)]"
              onClick={() => setSelectedServiceId(m.serviceId)}
            >
              <span className="text-xl" aria-hidden="true">
                {MODE_ICONS[m.mode]}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[0.9rem] font-semibold text-[var(--shell-text)]">
                  {m.label}
                </span>
                <span className="text-[0.8rem] text-[var(--shell-text-muted)]">
                  {m.description}
                </span>
              </span>
              <span className="shrink-0 text-[0.85rem] font-semibold tabular-nums text-[var(--shell-accent)]">
                {m.price}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
