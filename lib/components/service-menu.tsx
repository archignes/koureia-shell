"use client"

import { useCallback } from "react"
import { useBoundProp, useStateStore } from "@json-render/react"

type FormattedService = {
  id: string
  name: string
  duration: string
  price: string
}

type ServiceMenuProps = {
  primary: FormattedService[]
  extras: FormattedService[]
  preselectedId?: string
}

export function ServiceMenu({ primary, extras, preselectedId }: ServiceMenuProps) {
  const [selectedServiceId, setSelectedServiceId] = useBoundProp(
    preselectedId,
    "selectedServiceId"
  )
  const { set, state } = useStateStore()
  const selectedExtras = (state as Record<string, unknown>).selectedExtras as
    | string[]
    | undefined

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
          <legend className="service-menu__legend">Service</legend>
          <div className="service-menu__list">
            {primary.map((s) => {
              const active = selectedServiceId === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`service-menu__item${active ? " service-menu__item--active" : ""}`}
                  onClick={() =>
                    setSelectedServiceId(active ? "" : s.id)
                  }
                >
                  <span className="service-menu__name">{s.name}</span>
                  <span className="service-menu__meta">
                    <span className="service-menu__dur">{s.duration}</span>
                    <span className="service-menu__price">{s.price}</span>
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
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`service-menu__item service-menu__item--extra${checked ? " service-menu__item--active" : ""}`}
                  onClick={() => toggleExtra(s.id)}
                >
                  <span
                    className="service-menu__check"
                    aria-hidden="true"
                  >
                    {checked ? "\u2713" : ""}
                  </span>
                  <span className="service-menu__name">{s.name}</span>
                  <span className="service-menu__meta">
                    <span className="service-menu__dur">{s.duration}</span>
                    <span className="service-menu__price">{s.price}</span>
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
