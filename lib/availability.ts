import {
  mockAvailabilityResponse,
  mockBulkAvailabilityResponse,
  type AvailabilityResponse as BaseAvailabilityResponse,
  type BulkAvailabilityResponse as BaseBulkAvailabilityResponse,
  type AvailabilitySlot,
} from "./mock-availability"

export type AvailabilityResponse = BaseAvailabilityResponse & {
  error?: boolean
}

export type BulkAvailabilityResponse = BaseBulkAvailabilityResponse & {
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
    params.set("staffId", staffId)
  }

  try {
    // Fetch through the shell's own API route to avoid CORS issues
    // (client-side fetch to koureia.com from *.koureia.com is cross-origin)
    const response = await fetch(
      `/api/booking/availability?${params.toString()}`,
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

export async function fetchBulkAvailability(opts: {
  apiUrl?: string
  shopSlug: string
  serviceId?: string
  staffId?: string
  dateFrom: string
  days?: number
  mode?: "regular" | "after_hours"
  signal?: AbortSignal
}): Promise<BulkAvailabilityResponse> {
  const { apiUrl, shopSlug, serviceId, staffId, dateFrom, days = 14, mode = "after_hours", signal } = opts

  if (!apiUrl) {
    return mockBulkAvailabilityResponse(dateFrom, days, mode)
  }

  const params = new URLSearchParams({
    shop: shopSlug,
    dateFrom,
    days: String(days),
    mode,
  })
  if (serviceId) params.set("serviceId", serviceId)
  if (staffId) params.set("staffId", staffId)

  try {
    const response = await fetch(
      `/api/booking/availability?${params.toString()}`,
      { signal }
    )

    if (!response.ok) {
      console.error("[koureia-shell] fetchBulkAvailability failed:", response.status)
      return { dates: {}, timezone: "", surcharge_cents: null, error: true }
    }

    return (await response.json()) as BulkAvailabilityResponse
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error
    console.error("[koureia-shell] fetchBulkAvailability failed:", error)
    return { dates: {}, timezone: "", surcharge_cents: null, error: true }
  }
}
