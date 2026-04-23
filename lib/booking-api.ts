export type HoldResult = {
  hold: {
    id: string
    staff_id: string
    service_id: string
    starts_at: string
    ends_at: string
    expires_at: string
    status: string
    source: string
  }
}

export async function createBookingHold(opts: {
  shopSlug: string
  serviceId: string
  staffId: string
  date: string
  slotStart: string
  /** Full UTC ISO startsAt — used directly if provided, otherwise constructed from date+slotStart */
  startsAt?: string
  mode?: "regular" | "after_hours"
  clientName?: string
  clientPhone?: string
  addonServiceIds?: string[]
}): Promise<HoldResult> {
  const startsAt = opts.startsAt ?? `${opts.date}T${opts.slotStart}:00`

  const response = await fetch("/api/booking/holds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shopSlug: opts.shopSlug,
      serviceId: opts.serviceId,
      staffId: opts.staffId,
      startsAt,
      source: "public",
      mode: opts.mode,
      clientName: opts.clientName,
      clientPhone: opts.clientPhone,
      addonServiceIds: opts.addonServiceIds?.length ? opts.addonServiceIds : undefined,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.error || "Unable to hold this time slot. Please try again."
    )
  }

  return response.json()
}
