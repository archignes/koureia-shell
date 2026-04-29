import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"

import { middleware } from "./middleware"

function request(pathname: string, host = "beautyandthebarber.koureia.com") {
  return new NextRequest(`https://${host}${pathname}`, {
    headers: { host },
  })
}

function rewriteTarget(pathname: string) {
  const response = middleware(request(pathname))
  return response.headers.get("x-middleware-rewrite")
}

describe("tenant host middleware", () => {
  it("rewrites a tenant request to the domain-prefixed app route", () => {
    expect(rewriteTarget("/intake/barber")).toBe(
      "https://beautyandthebarber.koureia.com/beautyandthebarber.koureia.com/intake/barber",
    )
  })

  it("does not rewrite a path that is already domain-prefixed", () => {
    expect(rewriteTarget("/beautyandthebarber.koureia.com/intake/barber")).toBeNull()
  })
})
