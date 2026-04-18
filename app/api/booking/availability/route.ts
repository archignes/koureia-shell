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

  const slots = (rawSlots as Array<{
    time: string
    startsAt: string
    endsAt: string
    state: string
  }>).map((s) => ({
    start: s.time,
    end: s.endsAt.slice(11, 16), // "2026-04-18T06:40:00" → "06:40"
    available: s.state === "available",
  }))

  return NextResponse.json({
    date: date ?? "",
    timezone: data.shop?.timezone ?? "",
    slots,
    surcharge_cents: data.surcharge_cents ?? null,
  })
}
