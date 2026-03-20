import { describe, expect, it } from "vitest"

import { dayName, formatLabel, formatPrice, formatTime } from "./utils"

describe("dayName", () => {
  it("returns correct day names for 0-6", () => {
    expect(dayName(0)).toBe("Sunday")
    expect(dayName(1)).toBe("Monday")
    expect(dayName(5)).toBe("Friday")
    expect(dayName(6)).toBe("Saturday")
  })

  it("returns empty string for out-of-range values", () => {
    expect(dayName(-1)).toBe("")
    expect(dayName(7)).toBe("")
    expect(dayName(99)).toBe("")
  })

  it("returns empty string for non-integer values", () => {
    expect(dayName(1.5)).toBe("")
    expect(dayName(NaN)).toBe("")
  })
})

describe("formatTime", () => {
  it("formats morning times", () => {
    expect(formatTime("09:00")).toBe("9 AM")
    expect(formatTime("09:30")).toBe("9:30 AM")
    expect(formatTime("00:00")).toBe("12 AM")
  })

  it("formats afternoon/evening times", () => {
    expect(formatTime("12:00")).toBe("12 PM")
    expect(formatTime("13:00")).toBe("1 PM")
    expect(formatTime("17:30")).toBe("5:30 PM")
    expect(formatTime("23:59")).toBe("11:59 PM")
  })

  it("pads minutes to two digits", () => {
    expect(formatTime("14:05")).toBe("2:05 PM")
  })

  it("returns input unchanged for invalid times", () => {
    expect(formatTime("25:00")).toBe("25:00")
    expect(formatTime("12:60")).toBe("12:60")
    expect(formatTime("25:99")).toBe("25:99")
    expect(formatTime("-1:00")).toBe("-1:00")
    expect(formatTime("abc")).toBe("abc")
    expect(formatTime("12:ab")).toBe("12:ab")
    expect(formatTime("")).toBe("")
  })
})

describe("formatPrice", () => {
  it("formats cents to dollars", () => {
    expect(formatPrice(2500)).toBe("$25")
    expect(formatPrice(100)).toBe("$1")
    expect(formatPrice(0)).toBe("$0")
    expect(formatPrice(4999)).toBe("$50")
  })

  it("uses priceDisplay when provided", () => {
    expect(formatPrice(2500, "$25+")).toBe("$25+")
    expect(formatPrice(0, "Free")).toBe("Free")
  })
})

describe("formatLabel", () => {
  it("converts snake_case to Title Case", () => {
    expect(formatLabel("apple_pay")).toBe("Apple Pay")
    expect(formatLabel("google_pay")).toBe("Google Pay")
  })

  it("converts kebab-case to Title Case", () => {
    expect(formatLabel("some-label")).toBe("Some Label")
  })

  it("converts space-separated to Title Case", () => {
    expect(formatLabel("hello world")).toBe("Hello World")
  })

  it("handles single words", () => {
    expect(formatLabel("visa")).toBe("Visa")
    expect(formatLabel("cash")).toBe("Cash")
  })

  it("handles empty string", () => {
    expect(formatLabel("")).toBe("")
  })

  it("handles mixed separators", () => {
    expect(formatLabel("some_mixed-value here")).toBe("Some Mixed Value Here")
  })
})
