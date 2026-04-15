"use client"

import { useCallback, useEffect } from "react"
import { useStateBinding, useStateStore } from "@json-render/react"

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
    <div className="service-menu">
      {primary.length > 0 && (
        <fieldset className="service-menu__section">
          <legend className="service-menu__legend">{sectionLabel ?? "Service"}</legend>
          <div className="service-menu__list" role="radiogroup" aria-label={sectionLabel ?? "Service"}>
            {primary.map((s) => {
              const active = selectedServiceId === s.id
              const { label, badge } = splitServiceName(s.name)
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`service-menu__item${active ? " service-menu__item--active" : ""}`}
                  onClick={() =>
                    setSelectedServiceId(active ? "" : s.id)
                  }
                >
                  <span className="service-menu__radio" aria-hidden="true" />
                  <span className="service-menu__body">
                    <span className="service-menu__name">
                      {label}
                      {badge && <span className="service-menu__badge">{badge}</span>}
                    </span>
                    <span className="service-menu__meta">
                      <span className="service-menu__dur">{s.duration}</span>
                      <span className="service-menu__price">{s.price}</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
      {extras.length > 0 && (
        <fieldset className="service-menu__section service-menu__section--extras">
          <legend className="service-menu__legend">Add-ons</legend>
          <div className="service-menu__list">
            {extras.map((s) => {
              const checked = selectedExtras?.includes(s.id) ?? false
              const { label } = splitServiceName(s.name)
              return (
                <button
                  key={s.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  className={`service-menu__item service-menu__item--extra${checked ? " service-menu__item--active" : ""}`}
                  onClick={() => toggleExtra(s.id)}
                >
                  <span className="service-menu__check" aria-hidden="true">
                    {checked ? "\u2713" : ""}
                  </span>
                  <span className="service-menu__body">
                    <span className="service-menu__name">{label}</span>
                    <span className="service-menu__meta">
                      <span className="service-menu__dur">{s.duration}</span>
                      <span className="service-menu__price">{s.price}</span>
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
