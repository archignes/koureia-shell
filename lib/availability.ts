import {
  mockAvailabilityResponse,
  type AvailabilityResponse as BaseAvailabilityResponse,
  type AvailabilitySlot,
} from "./mock-availability"

export type AvailabilityResponse = BaseAvailabilityResponse & {
  error?: boolean
}

export type { AvailabilitySlot }

export async function fetchAvailability(opts: {
  apiUrl?: string
  shopSlug: string
  serviceId?: string
  staffId?: string
  date: string
  mode?: "regular" | "after_hours"
  signal?: AbortSignal
}): Promise<AvailabilityResponse> {
  const { apiUrl, shopSlug, serviceId, staffId, date, mode = "after_hours", signal } = opts

  if (!apiUrl) {
    return mockAvailabilityResponse(date, mode)
  }

  const params = new URLSearchParams({
    shop: shopSlug,
    date,
    mode,
  })
  if (serviceId) {
    params.set("serviceId", serviceId)
  }
  if (staffId) {
    params.set("staff", staffId)
  }

  try {
    const response = await fetch(
      `${apiUrl}/api/booking/availability?${params.toString()}`,
      { signal }
    )

    if (!response.ok) {
      console.error(
        "[koureia-shell] fetchAvailability failed:",
        `${response.status} for ${date}`
      )
      return { date, timezone: "", slots: [], surcharge_cents: null, error: true }
    }

    return (await response.json()) as AvailabilityResponse
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error
    console.error("[koureia-shell] fetchAvailability failed:", error)
    return { date, timezone: "", slots: [], surcharge_cents: null, error: true }
  }
}
