import { describe, expect, it } from "vitest"

import { buildRequestSpec } from "./build-request-spec"
import type { BookingContext } from "@/lib/booking-context"

type Service = BookingContext["services"][number]
type Staff = BookingContext["staff"][number]

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: overrides.id ?? "svc-1",
    name: overrides.name ?? "Men's Cut",
    description: overrides.description ?? null,
    duration_minutes: overrides.duration_minutes ?? 40,
    price_cents: overrides.price_cents ?? 7000,
    price_display: overrides.price_display ?? null,
    staff_ids: overrides.staff_ids ?? ["staff-1"],
  }
}

function makeStaff(overrides: Partial<Staff> = {}): Staff {
  return {
    id: overrides.id ?? "staff-1",
    name: overrides.name ?? "Enzo Nerio",
    role: overrides.role ?? "barber",
  }
}

const defaultServices = [
  makeService({ id: "svc-cut", name: "Men's Cut", staff_ids: ["staff-enzo"] }),
  makeService({ id: "svc-color", name: "Color Session", staff_ids: ["staff-cassie"] }),
]

const defaultStaff = [
  makeStaff({ id: "staff-enzo", name: "Enzo Nerio" }),
  makeStaff({ id: "staff-cassie", name: "Cassie" }),
]

function buildWaitlistSpec(overrides: Record<string, unknown> = {}) {
  return buildRequestSpec({
    shopName: "Test Shop",
    source: "waitlist",
    variant: "waitlist",
    services: defaultServices,
    staff: defaultStaff,
    ...overrides,
  })
}

function buildAfterHoursSpec(overrides: Record<string, unknown> = {}) {
  return buildRequestSpec({
    shopName: "Test Shop",
    source: "after-hours",
    variant: "after-hours",
    services: defaultServices,
    staff: defaultStaff,
    preselectedStaffId: "staff-enzo",
    staffName: "Enzo",
    afterHours: {
      surcharge_cents: 10000,
      surcharge_display: "+$100 after-hours fee",
      min_advance_hours: 24,
      booking_mode: "individual",
      package_name: null,
      package_price_cents: null,
      package_price_display: null,
      package_addons: [],
      logo_url: null,
    },
    ...overrides,
  })
}

function buildRegularRequestSpec(overrides: Record<string, unknown> = {}) {
  return buildRequestSpec({
    shopName: "Test Shop",
    source: "request",
    variant: "request",
    services: defaultServices,
    staff: defaultStaff,
    shopTimezone: "America/Los_Angeles",
    apiUrl: "https://api.example.com",
    shopSlug: "test-shop",
    ...overrides,
  })
}

describe("buildRequestSpec — submit wiring", () => {
  it("submit element has on.submit binding for waitlist", () => {
    const spec = buildWaitlistSpec()
    const submit = spec.elements.submit
    expect(submit).toBeDefined()
    expect(submit.on).toEqual({ submit: { action: "submit" } })
  })

  it("submit element has on.submit binding for after-hours", () => {
    const spec = buildAfterHoursSpec()
    expect(spec.elements.submit.on).toEqual({ submit: { action: "submit" } })
  })

  it("submit element has on.submit binding for regular appointment requests", () => {
    const spec = buildRegularRequestSpec()
    expect(spec.elements.submit.on).toEqual({ submit: { action: "submit" } })
  })
})

describe("buildRequestSpec — staff names", () => {
  it("maps staff to first-name-only in waitlist spec", () => {
    const spec = buildWaitlistSpec()
    const staffPick = spec.elements["staff-pick"]
    const staffProps = staffPick.props as { staff: { id: string; name: string }[] }
    expect(staffProps.staff.map((s) => s.name)).toEqual(["Enzo", "Cassie"])
  })

  it("preserves staff IDs after first-name mapping", () => {
    const spec = buildWaitlistSpec()
    const staffProps = spec.elements["staff-pick"].props as { staff: { id: string; name: string }[] }
    expect(staffProps.staff.map((s) => s.id)).toEqual(["staff-enzo", "staff-cassie"])
  })

  it("maps staff to first-name-only in after-hours spec", () => {
    const spec = buildAfterHoursSpec()
    const staffProps = spec.elements["staff-pick"].props as { staff: { id: string; name: string }[] }
    expect(staffProps.staff.map((s) => s.name)).toEqual(["Enzo", "Cassie"])
  })
})

describe("buildRequestSpec — waitlist structure", () => {
  it("includes staff-pick, service-menu, availability-pick, prefs, submit in waitlist children", () => {
    const spec = buildWaitlistSpec()
    const container = spec.elements.container
    expect(container.children).toEqual(["hero", "staff-pick", "service-menu", "availability-pick", "prefs", "submit"])
  })

  it("disables no-preference when no services are shared across staff", () => {
    const spec = buildWaitlistSpec()
    const staffProps = spec.elements["staff-pick"].props as { allowNoPreference: boolean }
    expect(staffProps.allowNoPreference).toBe(false)
  })

  it("enables no-preference when services are shared across staff", () => {
    const sharedServices = [
      makeService({ id: "svc-cut", name: "Men's Cut", staff_ids: ["staff-enzo", "staff-cassie"] }),
    ]
    const spec = buildWaitlistSpec({ services: sharedServices })
    const staffProps = spec.elements["staff-pick"].props as { allowNoPreference: boolean }
    expect(staffProps.allowNoPreference).toBe(true)
  })

  it("does not preselect staff for waitlist", () => {
    const spec = buildWaitlistSpec()
    const staffProps = spec.elements["staff-pick"].props as { preselectedId?: string }
    expect(staffProps.preselectedId).toBeUndefined()
  })

  it("waitlist prefs form has notes, name, email, phone fields", () => {
    const spec = buildWaitlistSpec()
    const prefsProps = spec.elements.prefs.props as { fields: string[] }
    expect(prefsProps.fields).toEqual(["notes", "name", "email", "phone"])
  })

  it("linked waitlist entry shows initials and only asks for notes", () => {
    const spec = buildWaitlistSpec({
      waitlistLinkToken: "raw-token",
      waitlistClientLabel: "Avery M.",
    })
    const children = spec.elements.container.children as string[]
    const noticeProps = spec.elements["linked-entry-notice"].props as { label: string }
    const prefsProps = spec.elements.prefs.props as { fields: string[] }

    expect(children).toContain("linked-entry-notice")
    expect(noticeProps.label).toBe("Avery M.")
    expect(prefsProps.fields).toEqual(["notes"])
    expect(spec.state?.isLinkedWaitlistEntry).toBe(true)
  })

  it("linked waitlist entry does not ask for contact fields", () => {
    const spec = buildWaitlistSpec({ waitlistLinkToken: "raw-token" })
    const prefsProps = spec.elements.prefs.props as { fields: string[] }

    expect(prefsProps.fields).not.toContain("name")
    expect(prefsProps.fields).not.toContain("email")
    expect(prefsProps.fields).not.toContain("phone")
  })

  it("waitlist state does not preselect staff", () => {
    const spec = buildWaitlistSpec()
    expect(spec.state?.selectedStaffId).toBeUndefined()
  })

  it("excludes new-client services from waitlist options for repeat clients", () => {
    const spec = buildWaitlistSpec({
      hideNewClientOptions: true,
      services: [
        makeService({ id: "svc-new", name: "(NEW CLIENT) Men's Cut", staff_ids: ["staff-enzo"] }),
        makeService({ id: "svc-return", name: "Men's Cut", staff_ids: ["staff-enzo"] }),
      ],
    })
    const serviceMenu = spec.elements["service-menu"].props as { primary: Array<{ id: string; name: string }> }
    expect(serviceMenu.primary.map((service) => service.id)).toEqual(["svc-return"])
  })

  it("keeps new-client services in waitlist options when repeat-client flag is absent", () => {
    const spec = buildWaitlistSpec({
      services: [
        makeService({ id: "svc-new", name: "(NEW CLIENT) Men's Cut", staff_ids: ["staff-enzo"] }),
        makeService({ id: "svc-return", name: "Men's Cut", staff_ids: ["staff-enzo"] }),
      ],
    })
    const serviceMenu = spec.elements["service-menu"].props as { primary: Array<{ id: string; name: string }> }
    expect(serviceMenu.primary.map((service) => service.id)).toEqual(["svc-new", "svc-return"])
  })
})

describe("buildRequestSpec — regular request structure", () => {
  it("uses on-hours availability with contact fields before submit", () => {
    const spec = buildRegularRequestSpec()
    const children = spec.elements.container.children as string[]

    expect(children).toEqual([
      "hero",
      "staff-pick",
      "service-menu",
      "availability-pick",
      "contact-fields",
      "submit",
    ])
    expect(spec.elements["availability-pick"].type).toBe("AvailabilityPicker")
    expect(spec.elements["service-menu"].type).toBe("ServiceMenu")
  })

  it("collects name and phone for regular appointment requests", () => {
    const spec = buildRegularRequestSpec()
    const props = spec.elements["contact-fields"].props as { fields: string[] }
    expect(props.fields).toEqual(["name", "phone", "email", "notes"])
  })

  it("uses request-and-confirm copy for regular appointment requests", () => {
    const spec = buildRegularRequestSpec()
    const heroProps = spec.elements.hero.props as { headline: string; subtitle: string }
    const submitProps = spec.elements.submit.props as { label: string; submittingLabel: string }

    expect(heroProps.headline).toBe("Request an appointment")
    expect(heroProps.subtitle).toContain("confirm")
    expect(submitProps.label).toBe("Send Request")
    expect(submitProps.submittingLabel).toBe("Sending...")
  })
})

describe("buildRequestSpec — after-hours structure", () => {
  it("includes service-menu, availability-pick, order-summary in after-hours children", () => {
    const spec = buildAfterHoursSpec()
    const children = spec.elements.container.children as string[]
    expect(children).toContain("service-menu")
    expect(children).toContain("availability-pick")
    expect(children).toContain("order-summary")
    expect(children).toContain("policy-confirm")
  })

  it("does not allow no-preference for after-hours staff picker", () => {
    const spec = buildAfterHoursSpec()
    const staffProps = spec.elements["staff-pick"].props as { allowNoPreference: boolean }
    expect(staffProps.allowNoPreference).toBe(false)
  })

  it("hides staff picker when preselected in after-hours", () => {
    const spec = buildAfterHoursSpec({ preselectedStaffId: "staff-enzo" })
    const children = spec.elements.container.children as string[]
    expect(children).not.toContain("staff-pick")
  })

  it("stores surcharge cents for after-hours", () => {
    const spec = buildAfterHoursSpec()
    expect(spec.state?.surchargeCents).toBe(10000)
  })

  it("includes email in after-hours contact fields", () => {
    const spec = buildAfterHoursSpec()
    const props = spec.elements["contact-fields"].props as { fields: string[] }
    expect(props.fields).toEqual(["name", "email", "phone", "notes"])
  })

  it("derives the package description from the staff's full-service description", () => {
    const spec = buildAfterHoursSpec({
      services: [
        makeService({
          id: "svc-after-hours",
          name: "AFTER HOURS",
          description: "After-hours barber services by request.",
          staff_ids: ["staff-enzo"],
        }),
        makeService({
          id: "svc-full-service",
          name: "Men's Full Service",
          description: "Includes haircut, taper or fade, beard service, and a hot towel finish.",
          staff_ids: ["staff-enzo"],
        }),
      ],
      preselectedServiceId: "svc-after-hours",
      afterHours: {
        surcharge_cents: 10000,
        surcharge_display: "+$100 after-hours fee",
        min_advance_hours: 24,
        booking_mode: "package",
        package_name: "After-Hours Package",
        package_price_cents: 15000,
        package_price_display: "$150",
        package_addons: [{ name: "Razor prep", gratis: true }, { name: "Wax", gratis: true }],
        logo_url: "https://example.com/logo.jpg",
      },
    })

    const state = spec.state as {
      afterHoursPackage: { description: string | null; addons: Array<{ name: string }> }
    }
    expect(state.afterHoursPackage.description).toBe(
      "Includes haircut, taper or fade, beard service, and a hot towel finish."
    )
    expect(state.afterHoursPackage.addons.map((addon) => addon.name)).toEqual(["Razor prep", "Wax"])
  })
})

describe("buildRequestSpec — state initialization", () => {
  it("initializes allFormattedServices in state", () => {
    const spec = buildWaitlistSpec()
    const state = spec.state as Record<string, unknown>
    const services = state.allFormattedServices as { id: string }[]
    expect(services).toHaveLength(2)
    expect(services.map((s) => s.id)).toEqual(["svc-cut", "svc-color"])
  })

  it("initializes serviceStaffMap in state", () => {
    const spec = buildWaitlistSpec()
    const state = spec.state as Record<string, unknown>
    const map = state.serviceStaffMap as Record<string, string[]>
    expect(map["svc-cut"]).toEqual(["staff-enzo"])
    expect(map["svc-color"]).toEqual(["staff-cassie"])
  })
})
