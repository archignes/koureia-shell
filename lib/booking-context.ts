export type BookingContext = {
  shop: {
    id: string
    slug: string
    timezone?: string
  }
  staff: Array<{
    id: string
    name: string
    role: string
  }>
  services: Array<{
    id: string
    name: string
    description?: string | null
    duration_minutes: number
    price_cents: number
    price_display: string | null
    staff_ids: string[]
  }>
  after_hours: {
    enabled: boolean
    surcharge_cents: number
    surcharge_display: string
    min_advance_hours: number
    staff_ids: string[]
    booking_mode: "individual" | "package"
    package_name: string | null
    package_price_cents: number | null
    package_price_display: string | null
    package_addons: Array<{ name: string; gratis: boolean }>
    logo_url: string | null
  } | null
}

export async function fetchBookingContext(
  apiUrl: string,
  slug: string
): Promise<BookingContext | null> {
  try {
    const response = await fetch(
      `${apiUrl}/api/booking/context?shop=${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 } }
    )

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`API error ${response.status}`)
    }

    const data = (await response.json()) as BookingContext

    // Backfill after_hours if the API doesn't return it yet
    if (data.after_hours === undefined) {
      data.after_hours = null
    }

    return data
  } catch (error) {
    console.error("[koureia-shell] fetchBookingContext failed:", error)
    return null
  }
}

/** Split services into primary (main cuts) and extras (short add-ons) */
export function splitServices(services: BookingContext["services"]) {
  const primary: BookingContext["services"] = []
  const extras: BookingContext["services"] = []

  for (const s of services) {
    const isExtra =
      s.name.startsWith("+") ||
      s.name.toLowerCase().includes("waxing") ||
      s.name.toLowerCase().includes("add-on") ||
      s.name.toLowerCase().includes("therapy") ||
      (s.duration_minutes <= 25 && s.price_cents <= 5000)
    if (isExtra) {
      extras.push(s)
    } else {
      primary.push(s)
    }
  }

  return { primary, extras }
}

/** Mock: pick a single after-hours staff member by name heuristic, or first */
export function mockAfterHoursStaffIds(staff: BookingContext["staff"]): string[] {
  const enzo = staff.find((m) => m.name.toLowerCase().includes("enzo"))
  if (enzo) return [enzo.id]
  return staff.length > 0 ? [staff[0].id] : []
}
