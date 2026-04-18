import { describe, expect, it } from "vitest"

import {
  findStaffByIdOrName,
  staffToFirstNames,
  filterAfterHoursService,
} from "./booking-filters"
import type { BookingContext } from "./booking-context"

type Staff = BookingContext["staff"][number]
type Service = BookingContext["services"][number]

function makeStaff(overrides: Partial<Staff>): Staff {
  return {
    id: overrides.id ?? "staff-1",
    name: overrides.name ?? "Alex Smith",
    role: overrides.role ?? "Barber",
  }
}

function makeService(overrides: Partial<Service>): Service {
  return {
    id: overrides.id ?? "svc-1",
    name: overrides.name ?? "Men's Cut",
    duration_minutes: overrides.duration_minutes ?? 40,
    price_cents: overrides.price_cents ?? 7000,
    price_display: overrides.price_display ?? null,
    staff_ids: overrides.staff_ids ?? ["staff-1"],
  }
}

const staffList: Staff[] = [
  makeStaff({ id: "id-enzo", name: "Enzo Nerio" }),
  makeStaff({ id: "id-cassie", name: "Cassie" }),
  makeStaff({ id: "id-christina", name: "Christina K" }),
]

describe("findStaffByIdOrName", () => {
  it("matches by UUID", () => {
    expect(findStaffByIdOrName(staffList, "id-enzo")?.name).toBe("Enzo Nerio")
  })

  it("matches by first name (case-insensitive)", () => {
    expect(findStaffByIdOrName(staffList, "enzo")?.id).toBe("id-enzo")
    expect(findStaffByIdOrName(staffList, "Enzo")?.id).toBe("id-enzo")
    expect(findStaffByIdOrName(staffList, "ENZO")?.id).toBe("id-enzo")
  })

  it("matches single-name staff", () => {
    expect(findStaffByIdOrName(staffList, "cassie")?.id).toBe("id-cassie")
  })

  it("matches first name only, not last", () => {
    expect(findStaffByIdOrName(staffList, "Nerio")).toBeUndefined()
    expect(findStaffByIdOrName(staffList, "K")).toBeUndefined()
  })

  it("returns undefined for no match", () => {
    expect(findStaffByIdOrName(staffList, "nobody")).toBeUndefined()
  })

  it("returns undefined for undefined query", () => {
    expect(findStaffByIdOrName(staffList, undefined)).toBeUndefined()
  })
})

describe("staffToFirstNames", () => {
  it("splits multi-word names to first name only", () => {
    const result = staffToFirstNames(staffList)
    expect(result.map((s) => s.name)).toEqual(["Enzo", "Cassie", "Christina"])
  })

  it("preserves id and role", () => {
    const result = staffToFirstNames(staffList)
    expect(result[0]).toEqual({ id: "id-enzo", name: "Enzo", role: "Barber" })
  })
})

describe("filterAfterHoursService", () => {
  const services = [
    makeService({ id: "cut", name: "(NEW CLIENT) Men's Cut" }),
    makeService({ id: "ah", name: "AFTER HOURS" }),
    makeService({ id: "color", name: "Color Session" }),
    makeService({ id: "ah2", name: "After Hours Special" }),
  ]

  it("removes services with 'AFTER HOURS' in the name (case-insensitive)", () => {
    const filtered = filterAfterHoursService(services)
    expect(filtered.map((s) => s.id)).toEqual(["cut", "color"])
  })

  it("returns all services when none match AFTER HOURS", () => {
    const clean = [
      makeService({ id: "a", name: "Cut" }),
      makeService({ id: "b", name: "Color" }),
    ]
    expect(filterAfterHoursService(clean)).toHaveLength(2)
  })
})
