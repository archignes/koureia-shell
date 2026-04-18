import { type NextRequest, NextResponse } from "next/server"

/**
 * Proxy for Koureia booking write endpoints.
 *
 * Forwards POST requests to the upstream Koureia API server-side,
 * avoiding CORS issues from cross-origin browser fetches.
 *
 * Matches: /api/booking/waitlist, /api/booking/request, /api/booking/holds
 * Does NOT match: /api/booking/availability (handled by its own GET route)
 */

const ALLOWED_PATHS = new Set(["waitlist", "request", "holds"])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const subpath = path.join("/")

  if (!ALLOWED_PATHS.has(subpath)) {
    return NextResponse.json(
      { error: `Unknown booking endpoint: ${subpath}` },
      { status: 404 },
    )
  }

  const apiUrl = process.env.KOUREIA_API_URL ?? "https://koureia.com"
  const body = await request.json()

  const upstream = await fetch(`${apiUrl}/api/booking/${subpath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const data = await upstream.json().catch(() => null)

  return NextResponse.json(
    data ?? { error: "Upstream returned no body" },
    { status: upstream.status },
  )
}
