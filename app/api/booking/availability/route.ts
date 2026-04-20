import { type NextRequest, NextResponse } from "next/server"

/**
 * Proxy for the Koureia availability API.
 *
 * - Avoids CORS (client fetches from same origin)
 * - Transforms the API response shape into the flat format the
 *   AvailabilityPicker expects: { date, timezone, slots, surcharge_cents }
 */
export async function GET(request: NextRequest) {
  const apiUrl = process.env.KOUREIA_API_URL ?? "https://koureia.com"
  const params = request.nextUrl.searchParams

  const shop = params.get("shop")
  const date = params.get("date")
  if (!shop) {
    return NextResponse.json(
      { error: "shop is required" },
      { status: 400 },
    )
  }

  const upstream = new URL(`${apiUrl}/api/booking/availability`)
  for (const [key, value] of params.entries()) {
    upstream.searchParams.set(key, value)
  }

  const response = await fetch(upstream.toString())

  if (!response.ok) {
    return NextResponse.json(
      { error: `Upstream error ${response.status}` },
      { status: response.status },
    )
  }

  const data = await response.json()

  // Transform: API returns { slotsByDate, shop.timezone, surcharge_cents }
  // Shell expects { date, timezone, slots: [{start, end, available}], surcharge_cents }
  const rawSlots = date && data.slotsByDate?.[date]
    ? data.slotsByDate[date]
    : Object.values(data.slotsByDate ?? {})[0] ?? []

  const shopTimezone: string = data.shop?.timezone ?? ""

  const slots = (rawSlots as Array<{
    time: string
    startsAt: string
    endsAt: string
    state: string
  }>).map((s) => ({
    start: s.time,
    end: utcToLocalTime(s.endsAt, shopTimezone),
    startsAt: s.startsAt,
    available: s.state === "available",
  }))

  return NextResponse.json({
    date: date ?? "",
    timezone: shopTimezone,
    slots,
    surcharge_cents: data.surcharge_cents ?? null,
  })
}

/** Convert a UTC ISO string to "HH:mm" in the given timezone. */
function utcToLocalTime(utcIso: string, timezone: string): string {
  if (!timezone) return utcIso.slice(11, 16)
  try {
    const date = new Date(utcIso)
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    }).formatToParts(date)
    const h = parts.find((p) => p.type === "hour")?.value ?? ""
    const m = parts.find((p) => p.type === "minute")?.value ?? ""
    return `${h}:${m}`
  } catch {
    return utcIso.slice(11, 16)
  }
}
