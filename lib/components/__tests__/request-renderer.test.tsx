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
  source: "after-hours" | "waitlist" | "sms-refinement"
  variant: "after-hours" | "waitlist"
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
  }
  shopTimezone?: string
  apiUrl?: string
  shopSlug?: string
}) => Spec

type LoadedRequestRenderer = typeof import("@/app/[domain]/book/after-hours/request-renderer").RequestRenderer

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
    if (id === "@/lib/components/staff-picker") {
      return { StaffPicker: () => null }
    }
    if (id === "@/lib/components/order-summary") {
      return { OrderSummary: () => null }
    }
    if (id === "@/lib/components/preference-form") {
      return { PreferenceForm: () => null }
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

function loadRequestRenderer(): LoadedRequestRenderer {
  const sourcePath = resolve(process.cwd(), "app/[domain]/book/after-hours/request-renderer.tsx")
  const source = readFileSync(sourcePath, "utf8")
  const transpiled = ts.transpileModule(
    `${source}\nexports.__test_RequestRenderer = RequestRenderer;\n`,
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
            clientPhone: state.phone,
            preferredDate: state.preferredDate,
            preferredSlotStart: state.preferredSlotStart,
            preferredSlotEnd: state.preferredSlotEnd,
            source: state.source,
          },
        }),
      }
    }
    if (id === "@/lib/booking-api") {
      return bookingApi
    }
    if (id === "@/lib/utils") {
      return {
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

  return module.exports.__test_RequestRenderer as LoadedRequestRenderer
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

function renderRequestRenderer(spec: Spec) {
  const LoadedRequestRenderer = loadRequestRenderer()
  return render(
    React.createElement(LoadedRequestRenderer, {
      spec,
      shopId: "shop-1",
      shopSlug: "example-shop",
      apiUrl: "https://api.example.com",
      variant: "after-hours",
    })
  )
}

describe("RequestRenderer after-hours submit flow", () => {
  const originalFetch = global.fetch
  let fetchMock: ReturnType<typeof vi.fn>
  let createBookingHoldSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch
    createBookingHoldSpy = vi.spyOn(bookingApi, "createBookingHold")
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
    renderRequestRenderer(buildAfterHoursSpec({ name: "", phone: "" }))

    await userEvent.click(screen.getByRole("button", { name: "Confirm Booking" }))

    expect(
      await screen.findByText("Please enter your name and phone number.")
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
        apiUrl: "https://api.example.com",
        shopSlug: "example-shop",
        serviceId: "svc-1",
        staffId: "staff-1",
        date: "2026-05-01",
        slotStart: "14:00",
      })
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/booking/holds",
      expect.objectContaining({
        method: "POST",
      })
    )
    expect(
      await screen.findByRole("heading", { name: "Your time is being held" })
    ).toBeInTheDocument()
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
})
