import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

import { KO_KS_PUBLIC_CONTRACT } from "@/lib/ko-ks-public-contract"

import { GET } from "./route"

function makeRequest(path: string) {
  return new NextRequest(`http://localhost${path}?shop=beauty-and-the-barber&date=2026-05-01`)
}

describe("booking availability proxy route", () => {
  const originalFetch = global.fetch
  const originalApiUrl = process.env.KOUREIA_API_URL
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    process.env.KOUREIA_API_URL = "https://upstream.example.com"
    fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env.KOUREIA_API_URL = originalApiUrl
    vi.restoreAllMocks()
  })

  it("forwards contracted availability GET path upstream", async () => {
    const path = KO_KS_PUBLIC_CONTRACT.bookingReadProxyPaths.find((contractPath) =>
      contractPath.endsWith("/availability"),
    )

    expect(path).toBe("/api/booking/availability")
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          shop: { timezone: "America/Los_Angeles" },
          slotsByDate: {
            "2026-05-01": [
              {
                time: "09:00",
                startsAt: "2026-05-01T16:00:00.000Z",
                endsAt: "2026-05-01T16:30:00.000Z",
                state: "available",
              },
            ],
          },
          surcharge_cents: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )

    const response = await GET(makeRequest(path ?? "/api/booking/availability"))

    expect(fetchMock).toHaveBeenCalledWith(
      "https://upstream.example.com/api/booking/availability?shop=beauty-and-the-barber&date=2026-05-01",
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      date: "2026-05-01",
      timezone: "America/Los_Angeles",
      slots: [
        {
          start: "09:00",
          end: "09:30",
          startsAt: "2026-05-01T16:00:00.000Z",
          available: true,
        },
      ],
      surcharge_cents: null,
    })
  })
})
