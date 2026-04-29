import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

import { KO_KS_PUBLIC_CONTRACT } from "@/lib/ko-ks-public-contract"

import { POST } from "../[...path]/route"

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/booking/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("booking proxy route", () => {
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

  it.each(KO_KS_PUBLIC_CONTRACT.bookingWriteProxyPaths)(
    "forwards contracted booking POST path %s upstream",
    async (path) => {
      const subpath = path.replace("/api/booking/", "")
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, path }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      )

      const response = await POST(makeRequest({ clientName: "Taylor" }), {
        params: Promise.resolve({ path: [subpath] }),
      })

      expect(fetchMock).toHaveBeenCalledWith(
        `https://upstream.example.com${path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientName: "Taylor" }),
        }
      )
      expect(response.status).toBe(201)
      expect(await response.json()).toEqual({ ok: true, path })
    },
  )

  it("forwards holds POST requests upstream", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ hold: { id: "hold-1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )

    const response = await POST(makeRequest({ startsAt: "2026-05-01T14:00:00" }), {
      params: Promise.resolve({ path: ["holds"] }),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "https://upstream.example.com/api/booking/holds",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ startsAt: "2026-05-01T14:00:00" }),
      })
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ hold: { id: "hold-1" } })
  })

  it("returns 404 for disallowed nested booking paths", async () => {
    const response = await POST(makeRequest({}), {
      params: Promise.resolve({ path: ["admin", "delete"] }),
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: "Unknown booking endpoint: admin/delete",
    })
  })

  it("passes through upstream 400 responses and the error body", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Missing serviceId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    )

    const response = await POST(makeRequest({ clientName: "Taylor" }), {
      params: Promise.resolve({ path: ["waitlist"] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Missing serviceId" })
  })
})
