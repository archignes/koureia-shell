import { describe, expect, it } from "vitest"

import { buildRequestPayload, normalizePhoneForApi, type RequestState } from "./booking-payload"

function makeState(overrides: Partial<RequestState> = {}): RequestState {
  return {
    selectedServiceId: "svc-1",
    selectedStaffId: "staff-1",
    name: "Daniel Griffin",
    email: "daniel@test.com",
    phone: "4255551234",
    flexibleDates: "Tomorrow afternoon",
    source: "waitlist",
    ...overrides,
  }
}

describe("buildRequestPayload — waitlist variant", () => {
  it("routes to /api/booking/waitlist", () => {
    const result = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState(),
      variant: "waitlist",
    })
    expect(result.path).toBe("/api/booking/waitlist")
  })

  it("includes all required waitlist fields", () => {
    const result = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState(),
      variant: "waitlist",
    })
    expect(result.body.shopSlug).toBe("test-shop")
    expect(result.body.clientName).toBe("Daniel Griffin")
    expect(result.body.clientEmail).toBe("daniel@test.com")
    expect(result.body.clientPhone).toBe("+14255551234")
    expect(result.body.serviceId).toBe("svc-1")
    expect(result.body.flexibleDates).toBe("Tomorrow afternoon")
  })

  it("sends staffId as null when no staff selected", () => {
    const result = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState({ selectedStaffId: undefined }),
      variant: "waitlist",
    })
    expect(result.body.staffId).toBeNull()
  })

  it("sends clientEmail as undefined when empty", () => {
    const result = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState({ email: "" }),
      variant: "waitlist",
    })
    expect(result.body.clientEmail).toBeUndefined()
  })

  it("trims whitespace-only values to undefined", () => {
    const result = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState({ name: "   ", flexibleDates: "  " }),
      variant: "waitlist",
    })
    expect(result.body.clientName).toBeUndefined()
    expect(result.body.flexibleDates).toBeUndefined()
  })

  it("passes waitlistId when present", () => {
    const result = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState(),
      variant: "waitlist",
      waitlistId: "abc-123",
    })
    expect(result.body.waitlistId).toBe("abc-123")
  })
})

describe("buildRequestPayload — general request variant", () => {
  it("routes to /api/booking/request", () => {
    const result = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState({ source: "waitlist" }),
      variant: "after-hours",
    })
    expect(result.path).toBe("/api/booking/request")
  })

  it("prefers preferredDate over dateRange", () => {
    const result = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState({ preferredDate: "2026-04-20", dateRange: "2026-04-18" }),
      variant: "after-hours",
    })
    expect(result.body.preferredDate).toBe("2026-04-20")
  })

  it("falls back to dateRange when preferredDate is absent", () => {
    const result = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState({ preferredDate: undefined, dateRange: "2026-04-18" }),
      variant: "after-hours",
    })
    expect(result.body.preferredDate).toBe("2026-04-18")
  })

  it("validates timeWindow values", () => {
    const valid = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState({ timeWindow: "morning" }),
      variant: "after-hours",
    })
    expect(valid.body.timeWindow).toBe("morning")

    const invalid = buildRequestPayload({
      shopId: "shop-1",
      shopSlug: "test-shop",
      state: makeState({ timeWindow: "midnight" as "morning" }),
      variant: "after-hours",
    })
    expect(invalid.body.timeWindow).toBeUndefined()
  })
})

describe("normalizePhoneForApi", () => {
  it("adds +1 prefix to 10-digit US numbers", () => {
    expect(normalizePhoneForApi("4255551234")).toBe("+14255551234")
  })

  it("adds + prefix to 11-digit numbers starting with 1", () => {
    expect(normalizePhoneForApi("14255551234")).toBe("+14255551234")
  })

  it("passes through already-formatted E.164 numbers", () => {
    expect(normalizePhoneForApi("+14255551234")).toBe("+14255551234")
  })

  it("strips non-digit characters before normalizing", () => {
    expect(normalizePhoneForApi("(425) 555-1234")).toBe("+14255551234")
  })

  it("returns undefined for empty/whitespace input", () => {
    expect(normalizePhoneForApi(undefined)).toBeUndefined()
    expect(normalizePhoneForApi("")).toBeUndefined()
    expect(normalizePhoneForApi("   ")).toBeUndefined()
  })

  it("returns raw value for non-standard formats", () => {
    expect(normalizePhoneForApi("+447911123456")).toBe("+447911123456")
  })
})
