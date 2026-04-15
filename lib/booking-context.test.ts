import { describe, expect, it } from "vitest"

import { mockAfterHoursStaffIds, splitServices, type BookingContext } from "./booking-context"

type Service = BookingContext["services"][number]
type Staff = BookingContext["staff"][number]

function makeService(overrides: Partial<Service>): Service {
  return {
    id: overrides.id ?? "service-1",
    name: overrides.name ?? "Men's Cut",
    duration_minutes: overrides.duration_minutes ?? 40,
    price_cents: overrides.price_cents ?? 7000,
    price_display: overrides.price_display ?? null,
    staff_ids: overrides.staff_ids ?? ["staff-1"],
  }
}

function makeStaff(overrides: Partial<Staff>): Staff {
  return {
    id: overrides.id ?? "staff-1",
    name: overrides.name ?? "Alex",
    role: overrides.role ?? "Barber",
  }
}

describe("splitServices", () => {
  it("keeps core cut services in primary", () => {
    const haircut = makeService({ id: "cut-1", name: "Men's Regular Cut" })

    expect(splitServices([haircut])).toEqual({
      primary: [haircut],
      extras: [],
    })
  })

  it("classifies add-ons by leading plus sign", () => {
    const addOn = makeService({ id: "extra-1", name: "+ Beard Clean Up" })

    expect(splitServices([addOn])).toEqual({
      primary: [],
      extras: [addOn],
    })
  })

  it("classifies services containing waxing, add-on, or therapy as extras", () => {
    const services = [
      makeService({ id: "wax", name: "Eyebrow Waxing" }),
      makeService({ id: "addon", name: "Scalp Add-On" }),
      makeService({ id: "therapy", name: "Red Light Therapy - Hair Growth" }),
    ]

    expect(splitServices(services)).toEqual({
      primary: [],
      extras: services,
    })
  })

  it("classifies short, low-priced services as extras", () => {
    const quickService = makeService({
      id: "quick",
      name: "Neck Clean Up",
      duration_minutes: 25,
      price_cents: 5000,
    })

    expect(splitServices([quickService])).toEqual({
      primary: [],
      extras: [quickService],
    })
  })
})

describe("mockAfterHoursStaffIds", () => {
  it("returns the id of a staff member whose name includes enzo", () => {
    const staff = [
      makeStaff({ id: "staff-1", name: "Alex" }),
      makeStaff({ id: "staff-2", name: "Enzo Rivera" }),
    ]

    expect(mockAfterHoursStaffIds(staff)).toEqual(["staff-2"])
  })

  it("falls back to the first staff member when enzo is not present", () => {
    const staff = [
      makeStaff({ id: "staff-1", name: "Alex" }),
      makeStaff({ id: "staff-2", name: "Marco" }),
    ]

    expect(mockAfterHoursStaffIds(staff)).toEqual(["staff-1"])
  })

  it("returns an empty array when there is no staff", () => {
    expect(mockAfterHoursStaffIds([])).toEqual([])
  })
})
