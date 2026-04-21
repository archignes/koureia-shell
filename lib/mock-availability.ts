export type AvailabilitySlot = {
  start: string
  end: string
  available: boolean
  /** Full UTC ISO startsAt from the API (e.g. "2026-04-22T01:00:00.000Z") */
  startsAt?: string
}

export type AvailabilityResponse = {
  date: string
  timezone: string
  slots: AvailabilitySlot[]
  surcharge_cents: number | null
}

export type BulkAvailabilityResponse = {
  dates: Record<string, { slots: AvailabilitySlot[]; availableCount: number }>
  timezone: string
  surcharge_cents: number | null
}

export function mockAvailabilityResponse(
  date: string,
  mode: "regular" | "after_hours" = "after_hours"
): AvailabilityResponse {
  const dayOfWeek = new Date(date + "T12:00:00").getDay()

  // No availability on Sundays
  if (dayOfWeek === 0) {
    return {
      date,
      timezone: "America/New_York",
      slots: [],
      surcharge_cents: mode === "after_hours" ? 10000 : null,
    }
  }

  // Weekday after-hours: evening slots
  const weekdaySlots: AvailabilitySlot[] = [
    { start: "17:00", end: "18:10", available: true },
    { start: "18:30", end: "19:40", available: true },
    { start: "20:00", end: "21:10", available: dayOfWeek !== 3 },
  ]

  // Saturday: more slots available
  const saturdaySlots: AvailabilitySlot[] = [
    { start: "10:00", end: "11:10", available: true },
    { start: "11:30", end: "12:40", available: true },
    { start: "13:00", end: "14:10", available: false },
    { start: "14:30", end: "15:40", available: true },
    { start: "16:00", end: "17:10", available: true },
  ]

  return {
    date,
    timezone: "America/New_York",
    slots: dayOfWeek === 6 ? saturdaySlots : weekdaySlots,
    surcharge_cents: mode === "after_hours" ? 10000 : null,
  }
}

export function mockBulkAvailabilityResponse(
  dateFrom: string,
  days: number,
  mode: "regular" | "after_hours" = "after_hours"
): BulkAvailabilityResponse {
  const dates: BulkAvailabilityResponse["dates"] = {}
  const start = new Date(dateFrom + "T12:00:00")

  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const single = mockAvailabilityResponse(dateStr, mode)
    dates[dateStr] = {
      slots: single.slots,
      availableCount: single.slots.filter((s) => s.available).length,
    }
  }

  return {
    dates,
    timezone: "America/New_York",
    surcharge_cents: mode === "after_hours" ? 10000 : null,
  }
}
