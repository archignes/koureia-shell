"use client"

import { useStateBinding } from "@json-render/react"
import { cn } from "@/lib/utils"

type Service = {
  id: string
  name: string
  description?: string
  duration: string
  price: string
}

type ServicePickerProps = {
  services: Service[]
  preselectedId?: string
}

export function ServicePicker({ services }: ServicePickerProps) {
  const [selectedServiceId, setSelectedServiceId] = useStateBinding<string | undefined>(
    "selectedServiceId"
  )

  return (
    <fieldset className="mt-4 m-0 border-0 p-0">
      <legend className="mb-2 block w-full border-b border-[var(--shell-border)] pb-[0.35rem] text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-[var(--shell-text-muted)]">
        Select a service
      </legend>
      <div className="grid gap-0 overflow-hidden rounded-[var(--shell-radius-md)] border border-[var(--shell-border)]">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id
          return (
            <label
              key={service.id}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 border-0 border-b border-b-[rgba(228,231,239,0.06)] bg-[rgba(228,231,239,0.02)] px-4 py-3 text-[var(--shell-text)] last:border-b-0 hover:bg-[rgba(228,231,239,0.05)] before:content-[''] before:h-[1.125rem] before:w-[1.125rem] before:shrink-0 before:rounded-full before:border-2 before:border-[var(--shell-border-strong)] before:bg-transparent before:transition-[border-color,background] before:duration-150 before:ease-[var(--shell-transition)]",
                isSelected && "border-l-2 border-l-[var(--shell-accent)] bg-[rgba(199,164,106,0.1)] before:border-[var(--shell-accent)] before:bg-[var(--shell-accent)] before:shadow-[inset_0_0_0_3px_var(--shell-bg-elevated)]"
              )}
              htmlFor={`service-${service.id}`}
            >
              <input
                checked={isSelected}
                className="absolute h-px w-px overflow-hidden [clip:rect(0,0,0,0)]"
                id={`service-${service.id}`}
                name="selectedServiceId"
                type="radio"
                onChange={() => setSelectedServiceId(service.id)}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-4">
                  <span className="min-w-0 text-[0.95rem] font-semibold">{service.name}</span>
                  <span className="inline-flex shrink-0 items-center gap-[0.6rem] whitespace-nowrap">
                    <span className="text-[0.85rem] tabular-nums text-[var(--shell-text-subtle)]">
                      {service.duration}
                    </span>
                    <span className="text-[0.85rem] tabular-nums text-[var(--shell-accent)]">
                      {service.price}
                    </span>
                  </span>
                </span>
                {service.description ? (
                  <span className="text-[0.8rem] text-[var(--shell-text-muted)] leading-snug">
                    {service.description}
                  </span>
                ) : null}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
