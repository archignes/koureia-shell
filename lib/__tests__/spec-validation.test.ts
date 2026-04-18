import { describe, expect, it } from "vitest"
import type { Spec } from "@json-render/core"

import { buildRequestSpec } from "../../app/[domain]/book/build-request-spec"

function assertEmitBindings(spec: Spec, componentType: string, expectedEvents: string[]) {
  const matchingElements = Object.entries(spec.elements).filter(
    ([, element]) => element.type === componentType
  )

  expect(matchingElements.length).toBeGreaterThan(0)

  for (const [elementId, element] of matchingElements) {
    for (const eventName of expectedEvents) {
      expect(
        element.on?.[eventName],
        `${componentType} element "${elementId}" is missing on.${eventName}`
      ).toBeDefined()
      expect(element.on?.[eventName]?.action).toBe(eventName)
    }
  }
}

const services = [
  {
    id: "svc-1",
    name: "Haircut",
    duration_minutes: 30,
    price_cents: 3000,
    price_display: "$30",
    staff_ids: ["staff-1"],
  },
]

const staff = [
  {
    id: "staff-1",
    name: "Jane",
    role: "Barber",
  },
]

describe("buildRequestSpec emit bindings", () => {
  it("requires SubmitButton elements to define on.submit for after-hours specs", () => {
    const spec = buildRequestSpec({
      shopName: "Test Shop",
      source: "after-hours",
      variant: "after-hours",
      services,
      staff,
      preselectedStaffId: "staff-1",
      afterHours: {
        surcharge_cents: 10000,
        surcharge_display: "+$100 fee",
        min_advance_hours: 24,
      },
      shopTimezone: "America/New_York",
      apiUrl: "https://test.koureia.com",
      shopSlug: "test-shop",
    })

    assertEmitBindings(spec, "SubmitButton", ["submit"])
  })

  it("requires SubmitButton elements to define on.submit for waitlist specs", () => {
    const spec = buildRequestSpec({
      shopName: "Test Shop",
      source: "waitlist",
      variant: "waitlist",
      services,
      staff,
    })

    assertEmitBindings(spec, "SubmitButton", ["submit"])
  })
})
