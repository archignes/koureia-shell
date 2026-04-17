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
  apiUrl: string
  shopSlug: string
  serviceId: string
  staffId: string
  date: string
  slotStart: string
}): Promise<HoldResult> {
  const startsAt = `${opts.date}T${opts.slotStart}:00`

  const response = await fetch(`${opts.apiUrl}/api/booking/holds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      shopSlug: opts.shopSlug,
      serviceId: opts.serviceId,
      staffId: opts.staffId,
      startsAt,
      source: "public",
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
