"use client"

import { useCallback, useEffect } from "react"
import { useStateBinding, useStateStore } from "@json-render/react"
import { cn } from "@/lib/utils"

type FormattedService = {
  id: string
  name: string
  duration: string
  price: string
}

/** Clean up service name: extract badges, strip gendered prefix */
export function splitServiceName(name: string): { label: string; badge?: string } {
  let label = name
  let badge: string | undefined

  // Extract parenthesized qualifiers like "(NEW CLIENT)"
  const match = label.match(/^\(([^)]+)\)\s*(.+)$/)
  if (match) { badge = match[1]; label = match[2] }

  // Handle "+" prefix add-ons
  if (label.startsWith("+ ")) { label = label.slice(2); badge = badge ?? "ADD-ON" }

  // Strip "Men's " / "Mens " prefix — context is set by section header
  label = label.replace(/^Men'?s\s+/i, "")

  return { label, badge }
}

type ServiceMenuProps = {
  primary: FormattedService[]
  extras: FormattedService[]
  preselectedId?: string
  sectionLabel?: string
}

export function ServiceMenu({ primary, extras, preselectedId, sectionLabel }: ServiceMenuProps) {
  const [boundServiceId, setSelectedServiceId] = useStateBinding<string>("selectedServiceId")
  const selectedServiceId = boundServiceId ?? preselectedId ?? ""
  const { set, state } = useStateStore()
  const selectedExtras = (state as Record<string, unknown>).selectedExtras as
    | string[]
    | undefined

  // Seed store with preselected value on mount (only if truly uninitialized)
  useEffect(() => {
    if (preselectedId && boundServiceId === undefined) {
      setSelectedServiceId(preselectedId)
    }
  }, [preselectedId, boundServiceId, setSelectedServiceId])

  const toggleExtra = useCallback(
    (id: string) => {
      const current = selectedExtras ?? []
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
      set("selectedExtras", next)
    },
    [selectedExtras, set]
  )

  return (
    <div className="mt-4 snap-start scroll-mt-2">
      {primary.length > 0 && (
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-[0.35rem] block w-full border-b border-[var(--shell-border)] pb-[0.25rem] text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-[var(--shell-text-muted)]">
            {sectionLabel ?? "Service"}
          </legend>
          <div
            className="grid gap-0 overflow-hidden border border-[var(--shell-border)]"
            role="radiogroup"
            aria-label={sectionLabel ?? "Service"}
          >
            {primary.map((s) => {
              const active = selectedServiceId === s.id
              const { label, badge } = splitServiceName(s.name)
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-[0.4rem] border-0 border-b border-b-[rgba(228,231,239,0.06)] bg-[rgba(228,231,239,0.02)] px-3 py-2 text-left text-[var(--shell-text)] transition-[background,border-color] duration-150 ease-[var(--shell-transition)] last:border-b-0 hover:bg-[rgba(228,231,239,0.05)]",
                    active && "bg-[rgba(199,164,106,0.12)]"
                  )}
                  onClick={() =>
                    setSelectedServiceId(active ? "" : s.id)
                  }
                >
                  <span
                    className={cn(
                      "inline-flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-full border-2 border-[var(--shell-border-strong)] bg-transparent transition-[border-color,background,box-shadow] duration-150 ease-[var(--shell-transition)]",
                      active && "border-[var(--shell-accent)] bg-[var(--shell-accent)] shadow-[inset_0_0_0_3px_var(--shell-bg-elevated)]"
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-[0.1rem]">
                    <span className={cn(
                      "flex items-center gap-[0.4rem] text-[0.9rem] font-medium",
                      active && "font-semibold text-[var(--shell-text)]"
                    )}>
                      {label}
                      {badge && (
                        <span
                          className={cn(
                            "inline-block whitespace-nowrap rounded bg-[rgba(199,164,106,0.15)] px-[0.35rem] py-[0.1rem] text-[0.6rem] font-bold uppercase tracking-[0.04em] text-[var(--shell-accent)]",
                            active && "bg-[rgba(199,164,106,0.2)] text-[var(--shell-accent)]"
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className={cn(
                        "text-[0.8rem] tabular-nums text-[var(--shell-text-subtle)]",
                        active && "text-[var(--shell-text-muted)]"
                      )}>
                        {s.duration}
                      </span>
                      <span className={cn(
                        "text-[0.85rem] font-semibold tabular-nums text-[var(--shell-accent)]",
                        active && "font-bold text-[var(--shell-accent)]"
                      )}>
                        {s.price}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
      {extras.length > 0 && (
        <fieldset className="mt-3 m-0 border-0 p-0">
          <legend className="mb-[0.35rem] block w-full border-b border-[var(--shell-border)] pb-[0.25rem] text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-[var(--shell-text-muted)]">
            Add-ons
          </legend>
          <div className="grid gap-0 overflow-hidden border border-[var(--shell-border)]">
            {extras.map((s) => {
              const checked = selectedExtras?.includes(s.id) ?? false
              const { label } = splitServiceName(s.name)
              return (
                <button
                  key={s.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-[0.4rem] border-0 border-b border-b-[rgba(228,231,239,0.06)] bg-[rgba(228,231,239,0.02)] px-3 py-2 text-left text-[var(--shell-text)] transition-[background,border-color] duration-150 ease-[var(--shell-transition)] last:border-b-0 hover:bg-[rgba(228,231,239,0.05)]",
                    checked && "bg-[rgba(199,164,106,0.12)]"
                  )}
                  onClick={() => toggleExtra(s.id)}
                >
                  <span
                    className={cn(
                      "inline-flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded border-[1.5px] border-[var(--shell-border-strong)] text-[0.7rem] text-transparent transition-[background,border-color,color] duration-150 ease-[var(--shell-transition)]",
                      checked && "border-[var(--shell-accent)] bg-[var(--shell-accent)] text-[var(--shell-accent-contrast)]"
                    )}
                    aria-hidden="true"
                  >
                    {checked ? "\u2713" : ""}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[0.1rem]">
                    <span className={cn(
                      "flex items-center gap-[0.4rem] text-[0.9rem] font-medium",
                      checked && "font-semibold text-[var(--shell-text)]"
                    )}>
                      {label}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className={cn(
                        "text-[0.8rem] tabular-nums text-[var(--shell-text-subtle)]",
                        checked && "text-[var(--shell-text-muted)]"
                      )}>
                        {s.duration}
                      </span>
                      <span className={cn(
                        "text-[0.85rem] font-semibold tabular-nums text-[var(--shell-accent)]",
                        checked && "font-bold text-[var(--shell-accent)]"
                      )}>
                        {s.price}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
    </div>
  )
}
