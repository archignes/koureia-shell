import { describe, expect, it } from "vitest"

import { buildRequestSpec } from "@/app/[domain]/book/build-request-spec"
import { buildRequestPayload, type RequestState } from "@/lib/booking-payload"
import type { BookingContext } from "@/lib/booking-context"

type Service = BookingContext["services"][number]
type Staff = BookingContext["staff"][number]

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: overrides.id ?? "svc-1",
    name: overrides.name ?? "Signature Cut",
    duration_minutes: overrides.duration_minutes ?? 60,
    price_cents: overrides.price_cents ?? 8500,
    price_display: overrides.price_display ?? "$85",
    staff_ids: overrides.staff_ids ?? ["staff-1"],
  }
}

function makeStaff(overrides: Partial<Staff> = {}): Staff {
  return {
    id: overrides.id ?? "staff-1",
    name: overrides.name ?? "Alex Smith",
    role: overrides.role ?? "Barber",
  }
}

const services = [
  makeService({ id: "svc-cut", name: "Signature Cut", staff_ids: ["staff-alex"] }),
  makeService({
    id: "svc-color",
    name: "Color Refresh",
    duration_minutes: 90,
    price_cents: 14500,
    price_display: "$145",
    staff_ids: ["staff-jordan"],
  }),
]

const staff = [
  makeStaff({ id: "staff-alex", name: "Alex Smith" }),
  makeStaff({ id: "staff-jordan", name: "Jordan Lee", role: "Colorist" }),
]

function buildWaitlistSpec() {
  return buildRequestSpec({
    shopName: "Test Shop",
    source: "waitlist",
    variant: "waitlist",
    services,
    staff,
    shopSlug: "test-shop",
  })
}

function makeWaitlistState(overrides: Partial<RequestState> = {}): RequestState {
  const spec = buildWaitlistSpec()

  return {
    ...(spec.state as RequestState),
    selectedServiceId: "svc-cut",
    selectedStaffId: undefined,
    name: "Taylor Client",
    email: "taylor@example.com",
    phone: "(425) 555-0101",
    flexibleDates: "Weekday evenings work best",
    notes: "Looking for a trim and cleanup",
    source: "waitlist",
    ...overrides,
  }
}

describe("waitlist booking flow integration", () => {
  it("builds a waitlist spec with the expected initial state and API contract", () => {
    const spec = buildWaitlistSpec()
    const state = spec.state as RequestState & {
      allFormattedServices: Array<{ id: string; name: string }>
    }

    expect(state.selectedStaffId).toBeUndefined()
    expect(state.allFormattedServices).toEqual([
      expect.objectContaining({ id: "svc-cut", name: "Signature Cut" }),
      expect.objectContaining({ id: "svc-color", name: "Color Refresh" }),
    ])

    const payload = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeWaitlistState(),
      variant: "waitlist",
    })

    expect(payload.path).toBe("/api/booking/waitlist")
    expect(payload.body).toEqual(
      expect.objectContaining({
        shopSlug: "test-shop",
        clientName: "Taylor Client",
        clientEmail: "taylor@example.com",
        clientPhone: "+14255550101",
        serviceId: "svc-cut",
        flexibleDates: "Weekday evenings work best",
      })
    )
  })

  it("sends a concrete staff ID when one is selected and null when none is selected", () => {
    const selected = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeWaitlistState({ selectedStaffId: "staff-alex" }),
      variant: "waitlist",
    })

    const noPreference = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeWaitlistState({ selectedStaffId: undefined }),
      variant: "waitlist",
    })

    expect(selected.body.staffId).toBe("staff-alex")
    expect(noPreference.body.staffId).toBeNull()
  })

  it("trims whitespace-only fields to undefined", () => {
    const payload = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeWaitlistState({
        name: "   ",
        email: "   ",
        phone: "   ",
        flexibleDates: "   ",
        notes: "   ",
      }),
      variant: "waitlist",
    })

    expect(payload.body.clientName).toBeUndefined()
    expect(payload.body.clientEmail).toBeUndefined()
    expect(payload.body.clientPhone).toBeUndefined()
    expect(payload.body.flexibleDates).toBeUndefined()
    expect(payload.body.notes).toBeUndefined()
  })

  it("leaves clientEmail undefined when email is missing, which the API currently rejects", () => {
    const payload = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeWaitlistState({ email: undefined }),
      variant: "waitlist",
    })

    expect(payload.body.clientEmail).toBeUndefined()
  })
})
