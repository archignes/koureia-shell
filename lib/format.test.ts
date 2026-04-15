import { describe, expect, it } from "vitest"

import { formatDuration, formatPrice } from "./format"

describe("formatDuration", () => {
  it("appends the minute suffix", () => {
    expect(formatDuration(40)).toBe("40min")
    expect(formatDuration(0)).toBe("0min")
  })
})

describe("formatPrice", () => {
  it("returns the provided display value when it is truthy after trimming", () => {
    expect(formatPrice(2500, "$25+")).toBe("$25+")
    expect(formatPrice(1500, "  Starting at $15  ")).toBe("  Starting at $15  ")
  })

  it("formats cents as USD currency when display is empty", () => {
    expect(formatPrice(2500, null)).toBe("$25")
    expect(formatPrice(2550, "")).toBe("$25.50")
    expect(formatPrice(2550, "   ")).toBe("$25.50")
  })
})
