import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const apiUrl = process.env.KOUREIA_API_URL ?? "https://koureia.com"
  const params = request.nextUrl.searchParams

  const shop = params.get("shop")
  const serviceId = params.get("serviceId")
  if (!shop || !serviceId) {
    return NextResponse.json(
      { error: "shop and serviceId are required" },
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
  return NextResponse.json(data)
}
