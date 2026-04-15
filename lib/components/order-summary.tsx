"use client"

import { useStateStore } from "@json-render/react"

type FormattedService = {
  id: string
  name: string
  duration: string
  price: string
  priceCents: number
}

type OrderSummaryProps = {
  allServices: FormattedService[]
  surchargeCents: number
}

function formatSlotTime(time24: string) {
  const [h, m] = time24.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatCents(cents: number, prefix?: string) {
  const amount = cents / 100
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return prefix ? `${prefix}${formatted}` : formatted
}

export function OrderSummary({ allServices, surchargeCents }: OrderSummaryProps) {
  const { state } = useStateStore()
  const s = state as Record<string, unknown>

  const serviceId = s.selectedServiceId as string | undefined
  const extraIds = (s.selectedExtras as string[] | undefined) ?? []
  const date = s.preferredDate as string | undefined
  const slotStart = s.preferredSlotStart as string | undefined

  const selectedService = serviceId
    ? allServices.find((svc) => svc.id === serviceId)
    : undefined
  const selectedExtras = allServices.filter((svc) => extraIds.includes(svc.id))

  const hasAnything = selectedService || selectedExtras.length > 0 || date

  if (!hasAnything) return null

  const serviceNames = [
    selectedService?.name,
    ...selectedExtras.map((e) => e.name),
  ].filter(Boolean)

  // Calculate total — use "from" prefix if any price_display contains "from"
  const serviceCents = selectedService?.priceCents ?? 0
  const extrasCents = selectedExtras.reduce((sum, e) => sum + e.priceCents, 0)
  const total = serviceCents + extrasCents + surchargeCents
  const hasVariable = [selectedService, ...selectedExtras].some(
    (svc) => svc?.price.startsWith("from")
  )

  return (
    <div className="mt-4 snap-start scroll-mt-2 rounded-xl border border-[rgba(199,164,106,0.2)] bg-[rgba(199,164,106,0.04)] px-3 py-[0.65rem]">
      {serviceNames.length > 0 && (
        <p className="m-0 text-[0.85rem] leading-[1.4] font-medium text-[var(--shell-text)] text-pretty">
          {serviceNames.join(" · ")}
        </p>
      )}
      {date && slotStart && (
        <p className="mt-[0.15rem] text-[0.8rem] text-[var(--shell-text-muted)]">
          {formatDate(date)} at {formatSlotTime(slotStart)}
        </p>
      )}
      {serviceCents > 0 && (
        <p className="mt-[0.35rem] border-t border-t-[rgba(199,164,106,0.12)] pt-[0.35rem] text-[0.9rem] font-semibold text-[var(--shell-accent)]">
          Estimated total {hasVariable ? "from " : ""}
          {formatCents(total)}
        </p>
      )}
    </div>
  )
}
