import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

import { KO_KS_PUBLIC_CONTRACT } from "@/lib/ko-ks-public-contract"

import { POST } from "../[...path]/route"

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/intake/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("intake proxy route", () => {
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

  it.each(KO_KS_PUBLIC_CONTRACT.intakeProxyPaths)(
    "forwards contracted intake POST path %s upstream",
    async (path) => {
      const subpath = path.replace("/api/intake/", "")
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, path }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )

      const response = await POST(makeRequest({ form_id: "form-1" }), {
        params: Promise.resolve({ path: [subpath] }),
      })

      const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
      expect(url.toString()).toBe(`https://upstream.example.com${path}`)
      expect(init.method).toBe("POST")
      expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe(
        JSON.stringify({ form_id: "form-1" }),
      )
      expect(response.status).toBe(201)
      expect(await response.json()).toEqual({ ok: true, path })
    },
  )
})
