import { describe, expect, it } from "vitest"

import { mockAvailabilityResponse } from "./mock-availability"

describe("mockAvailabilityResponse", () => {
  it("returns no slots on Sundays", () => {
    const response = mockAvailabilityResponse("2026-04-19", "regular")

    expect(response.timezone).toBe("America/New_York")
    expect(response.slots).toEqual([])
    expect(response.surcharge_cents).toBeNull()
  })

  it("returns the larger Saturday schedule", () => {
    const response = mockAvailabilityResponse("2026-04-18", "regular")

    expect(response.slots).toEqual([
      { start: "10:00", end: "11:10", available: true },
      { start: "11:30", end: "12:40", available: true },
      { start: "13:00", end: "14:10", available: false },
      { start: "14:30", end: "15:40", available: true },
      { start: "16:00", end: "17:10", available: true },
    ])
    expect(response.surcharge_cents).toBeNull()
  })

  it("returns weekday evening slots", () => {
    const response = mockAvailabilityResponse("2026-04-16", "regular")

    expect(response.slots).toEqual([
      { start: "17:00", end: "18:10", available: true },
      { start: "18:30", end: "19:40", available: true },
      { start: "20:00", end: "21:10", available: true },
    ])
  })

  it("includes the after-hours surcharge when requested", () => {
    const response = mockAvailabilityResponse("2026-04-15", "after_hours")

    expect(response.surcharge_cents).toBe(10000)
  })
})
