import { describe, expect, it } from "vitest"

import { buildRequestSpec } from "@/app/[domain]/book/build-request-spec"
import { buildRequestPayload, type RequestState } from "@/lib/booking-payload"
import type { BookingContext } from "@/lib/booking-context"

type Service = BookingContext["services"][number]
type Staff = BookingContext["staff"][number]

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: overrides.id ?? "svc-1",
    name: overrides.name ?? "After Hours Cut",
    duration_minutes: overrides.duration_minutes ?? 60,
    price_cents: overrides.price_cents ?? 12500,
    price_display: overrides.price_display ?? "$125",
    staff_ids: overrides.staff_ids ?? ["staff-1"],
  }
}

function makeStaff(overrides: Partial<Staff> = {}): Staff {
  return {
    id: overrides.id ?? "staff-1",
    name: overrides.name ?? "Enzo Nerio",
    role: overrides.role ?? "Barber",
  }
}

const services = [
  makeService({ id: "svc-cut", name: "Signature Cut", staff_ids: ["staff-enzo"] }),
  makeService({
    id: "svc-beard",
    name: "Cut and Beard",
    duration_minutes: 75,
    price_cents: 14500,
    price_display: "$145",
    staff_ids: ["staff-enzo"],
  }),
]

const staff = [
  makeStaff({ id: "staff-enzo", name: "Enzo Nerio" }),
  makeStaff({ id: "staff-cassie", name: "Cassie", role: "Barber" }),
]

function buildAfterHoursSpec(
  overrides: Partial<Parameters<typeof buildRequestSpec>[0]> = {}
) {
  return buildRequestSpec({
    shopName: "Test Shop",
    source: "after-hours",
    variant: "after-hours",
    services,
    staff,
    afterHours: {
      surcharge_cents: 10000,
      surcharge_display: "+$100 after-hours fee",
      min_advance_hours: 24,
    },
    shopTimezone: "America/Los_Angeles",
    shopSlug: "test-shop",
    ...overrides,
  })
}

function makeAfterHoursState(overrides: Partial<RequestState> = {}): RequestState {
  const spec = buildAfterHoursSpec({ preselectedStaffId: "staff-enzo", staffName: "Enzo" })

  return {
    ...(spec.state as RequestState),
    selectedServiceId: "svc-cut",
    selectedStaffId: "staff-enzo",
    preferredDate: "2026-05-02",
    dateRange: "2026-05-01",
    preferredSlotStart: "18:00",
    preferredSlotEnd: "19:00",
    name: "Taylor Client",
    phone: "425-555-0101",
    notes: "Please text to confirm",
    source: "after-hours",
    policyAccepted: true,
    ...overrides,
  }
}

describe("after-hours booking flow integration", () => {
  it("builds an after-hours spec with surcharge state and required children", () => {
    const spec = buildAfterHoursSpec({ preselectedStaffId: "staff-enzo", staffName: "Enzo" })
    const state = spec.state as RequestState
    const children = spec.elements.container.children as string[]

    expect(state.surchargeCents).toBe(10000)
    expect(children).toContain("service-menu")
    expect(children).toContain("policy-confirm")
  })

  it("builds an after-hours payload that posts to the request endpoint", () => {
    const payload = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeAfterHoursState(),
      variant: "after-hours",
    })

    expect(payload.path).toBe("/api/booking/request")
    expect(payload.body).toEqual(
      expect.objectContaining({
        shopId: "shop-1",
        serviceId: "svc-cut",
        staffId: "staff-enzo",
        clientName: "Taylor Client",
        clientPhone: "+14255550101",
        preferredDate: "2026-05-02",
        preferredSlotStart: "18:00",
        preferredSlotEnd: "19:00",
      })
    )
  })

  it("prefers preferredDate over dateRange when both are present", () => {
    const payload = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeAfterHoursState({
        preferredDate: "2026-05-02",
        dateRange: "2026-05-01",
      }),
      variant: "after-hours",
    })

    expect(payload.body.preferredDate).toBe("2026-05-02")
  })

  it("hides staff-pick when preselectedStaffId is provided", () => {
    const spec = buildAfterHoursSpec({
      preselectedStaffId: "staff-enzo",
      staffName: "Enzo",
    })

    expect(spec.elements.container.children).not.toContain("staff-pick")
  })
})
