/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import React from "react"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { Spec } from "@json-render/core"
import ts from "typescript"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { HoldResult } from "@/lib/booking-api"
import * as bookingApi from "@/lib/booking-api"

type BuildRequestSpec = (opts: {
  shopName: string
  source: "after-hours" | "waitlist" | "sms-refinement" | "request"
  variant: "after-hours" | "waitlist" | "request"
  services: Array<{
    id: string
    name: string
    duration_minutes: number
    price_cents: number
    price_display?: string
    staff_ids: string[]
  }>
  staff: Array<{
    id: string
    name: string
    role?: string
  }>
  preselectedServiceId?: string
  preselectedStaffId?: string
  staffName?: string
  afterHours?: {
    surcharge_cents: number
    surcharge_display: string
    min_advance_hours: number
    booking_mode: "individual" | "package"
    package_name: string | null
    package_price_cents: number | null
    package_price_display: string | null
    package_addons: Array<{ name: string; gratis: boolean }>
    logo_url: string | null
  }
  shopTimezone?: string
  apiUrl?: string
  shopSlug?: string
}) => Spec

type LoadedRequestRendererModule = {
  RequestRenderer: typeof import("@/app/[domain]/book/after-hours/request-renderer").RequestRenderer
  dedupePackageSlots: (slots: Array<{ start: string; end: string; startsAt?: string; endsAt?: string; available: boolean }>) => Array<{ start: string; end: string; startsAt?: string; endsAt?: string; available: boolean }>
}

type Store = {
  getSnapshot: () => Record<string, unknown>
  subscribe: (listener: () => void) => () => void
  set: (key: string, value: unknown) => void
  update: (patch: Record<string, unknown>) => void
}

const jsonRenderContext = React.createContext<{
  handlers: Record<string, () => Promise<void> | void>
  registry: {
    components: Record<string, React.ComponentType<Record<string, unknown>>>
  }
  setLoadingAction: React.Dispatch<React.SetStateAction<string | null>>
  loadingAction: string | null
  store: Store
} | null>(null)

let mockBulkAvailabilityResult: {
  dates: Record<string, { slots: Array<{ start: string; end: string; startsAt?: string; endsAt?: string; available: boolean }>; availableCount: number }>
  timezone: string
  surcharge_cents: number | null
} = {
  dates: {},
  timezone: "America/Los_Angeles",
  surcharge_cents: null,
}

function createTestStateStore(initialState: Record<string, unknown>): Store {
  let state = { ...initialState }
  const listeners = new Set<() => void>()

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set: (key, value) => {
      state = {
        ...state,
        [key]: value,
      }
      listeners.forEach((listener) => listener())
    },
    update: (patch) => {
      state = {
        ...state,
        ...patch,
      }
      listeners.forEach((listener) => listener())
    },
  }
}

function useTestStateStore() {
  const context = React.useContext(jsonRenderContext)
  if (!context) {
    throw new Error("JSON render context is missing")
  }

  const [, forceRender] = React.useReducer((value) => value + 1, 0)

  React.useEffect(() => context.store.subscribe(forceRender), [context.store])

  return {
    state: context.store.getSnapshot(),
    set: context.store.set,
    update: context.store.update,
  }
}

function loadRequestComponents() {
  const sourcePath = resolve(process.cwd(), "lib/json-render/registry/request.tsx")
  const source = readFileSync(sourcePath, "utf8")
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  }).outputText

  const module = { exports: {} as Record<string, unknown> }
  const fakeRequire = (id: string) => {
    if (id === "react") {
      return React
    }
    if (id === "@json-render/react") {
      return {
        useStateStore: useTestStateStore,
      }
    }
    if (id === "@/lib/components/availability-picker") {
      return { AvailabilityPicker: () => null }
    }
    if (id === "@/lib/components/service-picker") {
      return { ServicePicker: () => null }
    }
    if (id === "@/lib/components/service-menu") {
      return { ServiceMenu: () => null }
    }
    if (id === "@/lib/components/booking-mode-buttons") {
      return { BookingModeButtons: () => null }
    }
    if (id === "@/lib/components/staff-picker") {
      return { StaffPicker: () => null }
    }
    if (id === "@/lib/components/order-summary") {
      return { OrderSummary: () => null }
    }
    if (id === "@/lib/components/preference-form") {
      return { PreferenceForm: () => null }
    }
    if (id === "@/lib/components/waitlist-availability-picker") {
      return { WaitlistAvailabilityPicker: () => null }
    }
    if (id === "../catalog") {
      return { catalog: {} }
    }
    if (id === "react/jsx-runtime") {
      return require("react/jsx-runtime")
    }
    throw new Error(`Unexpected import: ${id}`)
  }

  new Function("require", "module", "exports", transpiled)(
    fakeRequire,
    module,
    module.exports
  )

  return module.exports.requestComponents as Record<string, React.ComponentType<Record<string, unknown>>>
}

function buildTestRegistry() {
  const requestComponents = loadRequestComponents()

  return {
    components: {
      Container: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
      SubmitButton: requestComponents.SubmitButton,
      BookingSuccess: requestComponents.BookingSuccess,
      ConfirmationMessage: requestComponents.ConfirmationMessage,
      PolicyConfirm: requestComponents.PolicyConfirm,
    },
  }
}

function createJsonRenderTestModule() {
  function JSONUIProvider({
    children,
    handlers,
    registry,
    store,
  }: {
    children: React.ReactNode
    handlers: Record<string, () => Promise<void> | void>
    registry: {
      components: Record<string, React.ComponentType<Record<string, unknown>>>
    }
    store: Store
  }) {
    const [loadingAction, setLoadingAction] = React.useState<string | null>(null)

    return React.createElement(
      jsonRenderContext.Provider,
      {
        value: {
          handlers,
          registry,
          setLoadingAction,
          loadingAction,
          store,
        },
      },
      children
    )
  }

  function Renderer({ spec }: { spec: Spec }) {
    const context = React.useContext(jsonRenderContext)
    if (!context) {
      throw new Error("JSON render context is missing")
    }

    const renderElement = (elementId: string): React.ReactNode => {
      const element = spec.elements[elementId]
      const Component = context.registry.components[element.type]
      if (!Component) {
        throw new Error(`Unknown component type: ${element.type}`)
      }

      const emit = async (eventName: string) => {
        const binding = element.on?.[eventName]
        if (!binding) return

        const action = (Array.isArray(binding) ? binding[0] : binding)?.action
        if (!action) return

        const handler = context.handlers[action]
        if (!handler) return

        context.setLoadingAction(eventName)
        try {
          await handler()
        } finally {
          context.setLoadingAction(null)
        }
      }

      const children = element.children?.map((childId) => renderElement(childId))

      return React.createElement(Component, {
        key: elementId,
        props: element.props ?? {},
        emit,
        loading: context.loadingAction === "submit",
        children,
      })
    }

    return React.createElement(React.Fragment, null, renderElement(spec.root))
  }

  return {
    JSONUIProvider,
    Renderer,
    createStateStore: createTestStateStore,
  }
}

function loadRequestRenderer(): LoadedRequestRendererModule {
  const sourcePath = resolve(process.cwd(), "app/[domain]/book/after-hours/request-renderer.tsx")
  const source = readFileSync(sourcePath, "utf8")
  const transpiled = ts.transpileModule(
    `${source}
exports.__test_RequestRenderer = RequestRenderer;
exports.__test_dedupePackageSlots = dedupePackageSlots;
`,
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
      fileName: sourcePath,
    }
  ).outputText

  const module = { exports: {} as Record<string, unknown> }
  const fakeRequire = (id: string) => {
    if (id === "react") {
      return React
    }
    if (id === "@json-render/react") {
      return createJsonRenderTestModule()
    }
    if (id === "@/lib/json-render/registry") {
      return { registry: buildTestRegistry() }
    }
    if (id === "@/lib/booking-payload") {
      return {
        buildRequestPayload: ({ state }: { state: Record<string, unknown> }) => ({
          path: "/api/booking/request",
          body: {
            serviceId: state.selectedServiceId,
            staffId: state.selectedStaffId,
            clientName: state.name,
            clientEmail: state.email,
            clientPhone: state.phone,
            preferredDate: state.preferredDate,
            preferredSlotStart: state.preferredSlotStart,
            preferredSlotEnd: state.preferredSlotEnd,
            source: state.source,
          },
        }),
        normalizePhoneForApi: (value: string | undefined) => {
          if (!value || !value.trim()) return undefined
          const digits = value.replace(/\D/g, "")
          if (digits.length === 10) return `+1${digits}`
          if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
          if (value.startsWith("+")) return value
          return `+${digits}`
        },
      }
    }
    if (id === "@/lib/booking-api") {
      return bookingApi
    }
    if (id === "@/lib/availability") {
      return {
        fetchBulkAvailability: vi.fn().mockImplementation(async () => mockBulkAvailabilityResult),
      }
    }
    if (id === "react-day-picker") {
      return {
        DayPicker: () => null,
      }
    }
    if (id === "@/lib/utils") {
      return {
        cn: (...values: Array<string | false | null | undefined>) =>
          values.filter(Boolean).join(" "),
        formatTime: (time: string) => {
          const [hours, minutes] = time.split(":").map(Number)
          const suffix = hours >= 12 ? "PM" : "AM"
          const normalizedHours = hours % 12 || 12
          return `${normalizedHours}:${String(minutes).padStart(2, "0")} ${suffix}`
        },
      }
    }
    if (id === "react/jsx-runtime") {
      return require("react/jsx-runtime")
    }
    throw new Error(`Unexpected import: ${id}`)
  }

  new Function("require", "module", "exports", transpiled)(
    fakeRequire,
    module,
    module.exports
  )

  return {
    RequestRenderer: module.exports.__test_RequestRenderer as LoadedRequestRendererModule["RequestRenderer"],
    dedupePackageSlots: module.exports.__test_dedupePackageSlots as LoadedRequestRendererModule["dedupePackageSlots"],
  }
}

function loadBuildRequestSpec() {
  const sourcePath = resolve(process.cwd(), "app/[domain]/book/build-request-spec.ts")
  const source = readFileSync(sourcePath, "utf8")
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  }).outputText

  const module = { exports: {} as Record<string, unknown> }
  const fakeRequire = (id: string) => {
    if (id === "@/lib/format") {
      return {
        formatDuration: (minutes: number) => `${minutes} min`,
        formatPrice: (priceCents: number) => `$${priceCents / 100}`,
      }
    }
    if (id === "@/lib/booking-context") {
      return {
        splitServices: (services: Array<unknown>) => ({
          primary: services,
          extras: [],
        }),
      }
    }
    if (id === "@/lib/booking-filters") {
      return {
        staffToFirstNames: (staff: Array<{ id: string; name: string; role?: string }>) =>
          staff.map((m) => ({ id: m.id, name: m.name.split(" ")[0], role: m.role })),
        extractBookingModes: (services: Array<{ name: string }>) => ({
          regular: services.filter(
            (s) => !s.name.toUpperCase().includes("AFTER HOURS") && !s.name.toUpperCase().includes("LOCAL AT HOME SERVICE")
          ),
          modes: [],
        }),
        hasSharedServices: (services: Array<{ staff_ids: string[] }>) =>
          services.some((s) => s.staff_ids.length > 1),
      }
    }
    if (id === "./request-page") {
      return {}
    }
    throw new Error(`Unexpected import: ${id}`)
  }

  new Function("require", "module", "exports", transpiled)(
    fakeRequire,
    module,
    module.exports
  )

  return module.exports.buildRequestSpec as BuildRequestSpec
}

function createFetchResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

function createDeferred<T>() {
  let resolvePromise!: (value: T | PromiseLike<T>) => void
  let rejectPromise!: (reason?: unknown) => void
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  }
}

function buildAfterHoursSpec(stateOverrides: Partial<Record<string, unknown>> = {}): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "Container",
        props: {},
        children: ["submit"],
      },
      submit: {
        type: "SubmitButton",
        props: { label: "Confirm Booking", submittingLabel: "Booking..." },
        on: { submit: { action: "submit" } },
      },
    },
    state: {
      selectedServiceId: "svc-1",
      selectedStaffId: "staff-1",
      preferredDate: "2026-05-01",
      preferredSlotStart: "14:00",
      name: "Test User",
      email: "test@example.com",
      phone: "5551234567",
      policyAccepted: true,
      source: "after-hours",
      allFormattedServices: [
        {
          id: "svc-1",
          name: "Signature Cut",
          duration: "60 min",
          price: "$85",
          priceCents: 8500,
        },
      ],
      ...stateOverrides,
    },
  }
}

function buildRegularRequestSpec(stateOverrides: Partial<Record<string, unknown>> = {}): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "Container",
        props: {},
        children: ["submit"],
      },
      submit: {
        type: "SubmitButton",
        props: { label: "Send Request", submittingLabel: "Sending..." },
        on: { submit: { action: "submit" } },
      },
    },
    state: {
      selectedServiceId: "svc-1",
      selectedStaffId: "staff-1",
      preferredDate: "2026-05-01",
      preferredSlotStart: "14:00",
      preferredSlotEnd: "14:40",
      preferredStartsAt: "2026-05-01T21:00:00.000Z",
      name: "Test User",
      phone: "5551234567",
      email: "",
      source: "request",
      allFormattedServices: [
        {
          id: "svc-1",
          name: "Signature Cut",
          duration: "40 min",
          price: "$45",
          priceCents: 4500,
        },
      ],
      ...stateOverrides,
    },
  }
}

function renderRequestRenderer(spec: Spec, variant: "after-hours" | "waitlist" | "request" = "after-hours") {
  const { RequestRenderer } = loadRequestRenderer()
  return render(
    React.createElement(RequestRenderer, {
      spec,
      shopId: "shop-1",
      shopSlug: "example-shop",
      apiUrl: "https://api.example.com",
      variant,
    })
  )
}

function buildAfterHoursPackageSpec(): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "Container",
        props: {},
        children: [],
      },
    },
    state: {
      selectedStaffId: "staff-1",
      selectedServiceId: "svc-after-hours",
      packageBaseServiceId: "svc-after-hours",
      afterHoursBookingMode: "package",
      afterHoursPackage: {
        name: "After-Hours Package",
        description: "Includes haircut, taper or fade, beard service, and a hot towel finish.",
        priceCents: 15000,
        priceDisplay: "$150",
        logoUrl: "https://example.com/logo.jpg",
        addons: [
          { name: "Razor prep", gratis: true },
          { name: "Wax", gratis: true },
        ],
      },
      allFormattedServices: [
        {
          id: "svc-after-hours",
          name: "AFTER HOURS",
          duration: "70 min",
          price: "$150",
          priceCents: 15000,
        },
      ],
      source: "after-hours",
    },
  }
}

describe("RequestRenderer after-hours submit flow", () => {
  const originalFetch = global.fetch
  let fetchMock: ReturnType<typeof vi.fn>
  let createBookingHoldSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch
    createBookingHoldSpy = vi.spyOn(bookingApi, "createBookingHold")
    mockBulkAvailabilityResult = {
      dates: {},
      timezone: "America/Los_Angeles",
      surcharge_cents: null,
    }
  })

  afterEach(() => {
    cleanup()
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it("wires the after-hours submit element with a submit action binding", () => {
    const buildRequestSpec = loadBuildRequestSpec()
    const spec = buildRequestSpec({
      shopName: "Test Shop",
      source: "after-hours",
      variant: "after-hours",
      services: [
        {
          id: "svc-1",
          name: "Signature Cut",
          duration_minutes: 60,
          price_cents: 8500,
          staff_ids: ["staff-1"],
        },
      ],
      staff: [
        {
          id: "staff-1",
          name: "Alex",
          role: "Barber",
        },
      ],
      preselectedServiceId: "svc-1",
      preselectedStaffId: "staff-1",
      staffName: "Alex",
      afterHours: {
        surcharge_cents: 10000,
        surcharge_display: "+$100 after-hours fee added to the service total",
        min_advance_hours: 24,
        booking_mode: "individual",
        package_name: null,
        package_price_cents: null,
        package_price_display: null,
        package_addons: [],
        logo_url: null,
      },
      shopTimezone: "America/Los_Angeles",
      apiUrl: "https://api.example.com",
      shopSlug: "example-shop",
    })

    expect(spec.elements.submit.on).toEqual({
      submit: { action: "submit" },
    })
  })

  it("validates policyAccepted before after-hours submission", async () => {
    renderRequestRenderer(buildAfterHoursSpec({ policyAccepted: false }))

    await userEvent.click(screen.getByRole("button", { name: "Confirm Booking" }))

    expect(
      await screen.findByText("Please acknowledge the booking terms to continue.")
    ).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("validates required name and phone fields", async () => {
    renderRequestRenderer(buildAfterHoursSpec({ name: "", email: "", phone: "" }))

    await userEvent.click(screen.getByRole("button", { name: "Confirm Booking" }))

    expect(
      await screen.findByText("Please enter your name, email, and phone number.")
    ).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("creates a hold and shows the booking success state when submission succeeds", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith("/api/booking/holds")) {
        return createFetchResponse({
          hold: {
            id: "hold-1",
            staff_id: "staff-1",
            service_id: "svc-1",
            starts_at: "2026-05-01T14:00:00",
            ends_at: "2026-05-01T15:00:00",
            expires_at: "2026-05-01T14:15:00",
            status: "held",
            source: "public",
          },
        })
      }

      if (url.endsWith("/api/booking/request")) {
        return createFetchResponse({ ok: true })
      }

      throw new Error(`Unexpected fetch URL: ${url}`)
    })

    renderRequestRenderer(buildAfterHoursSpec())

    await userEvent.click(screen.getByRole("button", { name: "Confirm Booking" }))

    await waitFor(() => {
      expect(createBookingHoldSpy).toHaveBeenCalledWith({
        shopSlug: "example-shop",
        serviceId: "svc-1",
        staffId: "staff-1",
        date: "2026-05-01",
        slotStart: "14:00",
        mode: "after_hours",
        clientName: "Test User",
        clientPhone: "+15551234567",
      })
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/booking/request",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("\"clientEmail\":\"test@example.com\""),
      })
    )
    expect(
      await screen.findByRole("heading", { name: "Your time is being held" })
    ).toBeInTheDocument()
  })

  it("creates a pending regular hold and shows request-received copy", async () => {
    createBookingHoldSpy.mockResolvedValueOnce({
      hold: {
        id: "hold-regular-1",
        staff_id: "staff-1",
        service_id: "svc-1",
        starts_at: "2026-05-01T21:00:00.000Z",
        ends_at: "2026-05-01T21:40:00.000Z",
        expires_at: "2026-05-02T21:00:00.000Z",
        status: "pending",
        source: "public",
      },
    })

    renderRequestRenderer(buildRegularRequestSpec(), "request")

    await userEvent.click(screen.getByRole("button", { name: "Send Request" }))

    await waitFor(() => {
      expect(createBookingHoldSpy).toHaveBeenCalledWith({
        shopSlug: "example-shop",
        serviceId: "svc-1",
        staffId: "staff-1",
        date: "2026-05-01",
        slotStart: "14:00",
        startsAt: "2026-05-01T21:00:00.000Z",
        mode: "regular",
        clientName: "Test User",
        clientPhone: "+15551234567",
      })
    })
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/booking/waitlist",
      expect.anything(),
    )
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/booking/request",
      expect.anything(),
    )
    expect(
      await screen.findByRole("heading", { name: "Request received" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("Your request has been sent. Staff will review it and confirm by text.")
    ).toBeInTheDocument()
    expect(screen.queryByText("✓")).not.toBeInTheDocument()
  })

  it("requires name and phone before regular request submission", async () => {
    renderRequestRenderer(buildRegularRequestSpec({ name: "", phone: "" }), "request")

    await userEvent.click(screen.getByRole("button", { name: "Send Request" }))

    expect(
      await screen.findByText("Please enter your name and phone number.")
    ).toBeInTheDocument()
    expect(createBookingHoldSpy).not.toHaveBeenCalled()
  })

  it("disables the submit button while the submit handler is loading", async () => {
    const holdResponse = createDeferred<HoldResult>()
    createBookingHoldSpy.mockReturnValueOnce(holdResponse.promise)
    fetchMock.mockResolvedValue(createFetchResponse({ ok: true }))

    renderRequestRenderer(buildAfterHoursSpec())

    const submitButton = screen.getByRole("button", { name: "Confirm Booking" })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Booking..." })).toBeDisabled()
    })

    holdResponse.resolve({
      hold: {
        id: "hold-1",
        staff_id: "staff-1",
        service_id: "svc-1",
        starts_at: "2026-05-01T14:00:00",
        ends_at: "2026-05-01T15:00:00",
        expires_at: "2026-05-01T14:15:00",
        status: "held",
        source: "public",
      },
    })

    expect(await screen.findByRole("heading", { name: "Your time is being held" })).toBeInTheDocument()
  })

  it("renders package description and both complimentary add-ons in package mode", async () => {
    renderRequestRenderer(buildAfterHoursPackageSpec())

    expect(await screen.findByRole("heading", { name: "After-Hours Package" })).toBeInTheDocument()
    expect(
      screen.getByText("Includes haircut, taper or fade, beard service, and a hot towel finish.")
    ).toBeInTheDocument()
    expect(screen.getByText("Razor prep")).toBeInTheDocument()
    expect(screen.getByText("Wax")).toBeInTheDocument()
  })

  it("dedupes duplicate package slots with the same startsAt", async () => {
    const { dedupePackageSlots } = loadRequestRenderer()
    const deduped = dedupePackageSlots([
      { start: "17:00", end: "18:10", startsAt: "2026-04-26T00:00:00.000Z", endsAt: "2026-04-26T01:10:00.000Z", available: true },
      { start: "17:30", end: "18:40", startsAt: "2026-04-26T00:30:00.000Z", endsAt: "2026-04-26T01:40:00.000Z", available: true },
      { start: "18:00", end: "19:10", startsAt: "2026-04-26T01:00:00.000Z", endsAt: "2026-04-26T02:10:00.000Z", available: true },
      { start: "18:30", end: "19:40", startsAt: "2026-04-26T01:30:00.000Z", endsAt: "2026-04-26T02:40:00.000Z", available: true },
      { start: "17:30", end: "18:40", startsAt: "2026-04-26T00:30:00.000Z", endsAt: "2026-04-26T01:40:00.000Z", available: true },
      { start: "18:00", end: "19:10", startsAt: "2026-04-26T01:00:00.000Z", endsAt: "2026-04-26T02:10:00.000Z", available: true },
    ])

    expect(deduped.map((slot) => slot.startsAt)).toEqual([
      "2026-04-26T00:00:00.000Z",
      "2026-04-26T00:30:00.000Z",
      "2026-04-26T01:00:00.000Z",
      "2026-04-26T01:30:00.000Z",
    ])
  })
})
