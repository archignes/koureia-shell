/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import React from "react"
import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { Spec } from "@json-render/core"
import ts from "typescript"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type BuildRequestSpec = typeof import("@/app/[domain]/book/build-request-spec").buildRequestSpec
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

function loadModule<T>(
  filePath: string,
  requireMap: Record<string, unknown>,
  exportName?: string,
): T {
  const source = readFileSync(filePath, "utf8")
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  }).outputText

  const module = { exports: {} as Record<string, unknown> }
  const fakeRequire = (id: string) => {
    if (id in requireMap) return requireMap[id]
    if (id === "react/jsx-runtime") return require("react/jsx-runtime")
    throw new Error(`Unexpected import: ${id}`)
  }

  new Function("require", "module", "exports", transpiled)(
    fakeRequire,
    module,
    module.exports
  )

  return exportName
    ? (module.exports[exportName] as T)
    : (module.exports as T)
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

  function useStateStore() {
    return useTestStateStore()
  }

  function useStateBinding<T>(key: string) {
    const { state, set } = useTestStateStore()
    return [state[key] as T, (value: T | undefined) => set(key, value)] as const
  }

  return {
    JSONUIProvider,
    Renderer,
    createStateStore: createTestStateStore,
    useStateStore,
    useStateBinding,
  }
}

function loadRequestComponents() {
  const jsonRenderTestModule = createJsonRenderTestModule()
  const componentRequireMap = {
    react: React,
    "@json-render/react": jsonRenderTestModule,
    "@/lib/utils": {
      cn: (...inputs: Array<string | false | null | undefined>) =>
        inputs.filter(Boolean).join(" "),
    },
  }

  const StaffPicker = loadModule<React.ComponentType<Record<string, unknown>>>(
    resolve(process.cwd(), "lib/components/staff-picker.tsx"),
    componentRequireMap,
    "StaffPicker"
  )
  const ServicePicker = loadModule<React.ComponentType<Record<string, unknown>>>(
    resolve(process.cwd(), "lib/components/service-picker.tsx"),
    componentRequireMap,
    "ServicePicker"
  )
  const ServiceMenu = loadModule<React.ComponentType<Record<string, unknown>>>(
    resolve(process.cwd(), "lib/components/service-menu.tsx"),
    componentRequireMap,
    "ServiceMenu"
  )
  const PreferenceForm = loadModule<React.ComponentType<Record<string, unknown>>>(
    resolve(process.cwd(), "lib/components/preference-form.tsx"),
    {
      react: React,
      "@json-render/react": jsonRenderTestModule,
    },
    "PreferenceForm"
  )

  const requestModule = loadModule<{
    requestComponents: Record<string, React.ComponentType<Record<string, unknown>>>
  }>(
    resolve(process.cwd(), "lib/json-render/registry/request.tsx"),
    {
      react: React,
      "@json-render/react": jsonRenderTestModule,
      "@/lib/components/availability-picker": { AvailabilityPicker: () => null },
      "@/lib/components/service-picker": { ServicePicker },
      "@/lib/components/service-menu": { ServiceMenu },
      "@/lib/components/booking-mode-buttons": { BookingModeButtons: () => null },
      "@/lib/components/staff-picker": { StaffPicker },
      "@/lib/components/order-summary": { OrderSummary: () => null },
      "@/lib/components/preference-form": { PreferenceForm },
      "@/lib/components/waitlist-availability-picker": {
        WaitlistAvailabilityPicker: ({ onChange }: { onChange: (blocks: Array<Record<string, string>>) => void }) =>
          React.createElement(
            "button",
            {
              type: "button",
              onClick: () =>
                onChange([
                  { date: "2026-04-24", start_time: "09:00", end_time: "10:00" },
                ]),
            },
            "Pick availability"
          ),
      },
      "../catalog": { catalog: {} },
    }
  )

  return requestModule.requestComponents
}

function buildTestRegistry() {
  const requestComponents = loadRequestComponents()

  return {
    components: {
      Container: ({ children }: { children?: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
      RequestHero: requestComponents.RequestHero,
      StaffPicker: requestComponents.StaffPicker,
      LinkedEntryNotice: requestComponents.LinkedEntryNotice,
      ServicePicker: requestComponents.ServicePicker,
      ServiceMenu: requestComponents.ServiceMenu,
      BookingModeButtons: requestComponents.BookingModeButtons,
      PreferenceForm: requestComponents.PreferenceForm,
      WaitlistAvailabilityPicker: requestComponents.WaitlistAvailabilityPicker,
      SubmitButton: requestComponents.SubmitButton,
      ConfirmationMessage: requestComponents.ConfirmationMessage,
    },
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
          path: "/api/booking/waitlist",
          body: {
            serviceId: state.selectedServiceId,
            staffId: state.selectedStaffId ?? null,
            clientName: state.name,
            clientEmail: state.email,
            clientPhone: state.phone,
            availability_blocks: state.availabilityBlocks,
            notes: state.notes,
            source: state.source,
            waitlistLinkToken: state.waitlistLinkToken,
          },
        }),
      }
    }
    if (id === "@/lib/booking-api") {
      return {
        createBookingHold: vi.fn(),
      }
    }
    if (id === "@/lib/availability") {
      return {
        fetchBulkAvailability: vi.fn(),
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
        formatTime: (time: string) => time,
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

function loadBuildRequestSpec(): BuildRequestSpec {
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
        formatPrice: (priceCents: number, priceDisplay?: string) =>
          priceDisplay ?? `$${priceCents / 100}`,
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
          staff.map((member) => ({
            id: member.id,
            name: member.name.split(" ")[0],
            role: member.role,
          })),
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

function createFetchResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

function createDeferred<T>() {
  let resolvePromise!: (value: T | PromiseLike<T>) => void
  let rejectPromise!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromiseValue, rejectPromiseValue) => {
    resolvePromise = resolvePromiseValue
    rejectPromise = rejectPromiseValue
  })

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  }
}

function buildWaitlistSpec(specOverrides: Record<string, unknown> = {}): Spec {
  const buildRequestSpec = loadBuildRequestSpec()

  return buildRequestSpec({
    shopName: "Test Shop",
    source: "waitlist",
    variant: "waitlist",
    services: [
      {
        id: "svc-cut",
        name: "Signature Cut",
        duration_minutes: 60,
        price_cents: 8500,
        price_display: "$85",
        staff_ids: ["staff-enzo"],
      },
      {
        id: "svc-color",
        name: "Color Session",
        duration_minutes: 90,
        price_cents: 14500,
        price_display: "$145",
        staff_ids: ["staff-cassie"],
      },
      {
        id: "svc-style",
        name: "Style Finish",
        duration_minutes: 45,
        price_cents: 6500,
        price_display: "$65",
        staff_ids: ["staff-enzo", "staff-cassie"],
      },
    ],
    staff: [
      {
        id: "staff-enzo",
        name: "Enzo Nerio",
        role: "Barber",
      },
      {
        id: "staff-cassie",
        name: "Cassie Lane",
        role: "Colorist",
      },
    ],
    shopSlug: "example-shop",
    ...specOverrides,
  })
}

function renderRequestRenderer(spec: Spec, props: Record<string, unknown> = {}) {
  const RequestRenderer = loadRequestRenderer()

  return render(
    React.createElement(RequestRenderer, {
      spec,
      shopId: "shop-1",
      shopSlug: "example-shop",
      apiUrl: "https://api.example.com",
      variant: "waitlist",
      ...props,
    })
  )
}

describe("RequestRenderer waitlist flow", () => {
  const originalFetch = global.fetch
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch
  })

  afterEach(() => {
    cleanup()
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it("updates the selected staff radio when a staff member is chosen", async () => {
    renderRequestRenderer(buildWaitlistSpec())

    const enzoRadio = screen.getByLabelText(/Enzo/i)
    await userEvent.click(enzoRadio)

    expect(enzoRadio).toBeChecked()
  })

  it("hides services until a staff member is selected", async () => {
    renderRequestRenderer(buildWaitlistSpec())

    expect(screen.getByText("Select a staff member to see their services")).toBeInTheDocument()
    expect(screen.queryByText("Services")).not.toBeInTheDocument()

    await userEvent.click(screen.getByLabelText(/Enzo/i))

    await waitFor(() => {
      expect(screen.queryByText("Select a staff member to see their services")).not.toBeInTheDocument()
    })
    expect(screen.getByText("Services")).toBeInTheDocument()
  })

  it("filters the visible service list after selecting a staff member", async () => {
    renderRequestRenderer(buildWaitlistSpec())

    // Select Enzo first to see services
    await userEvent.click(screen.getByLabelText(/Enzo/i))
    await waitFor(() => {
      expect(screen.getByText("Services")).toBeInTheDocument()
    })

    const serviceFieldset = screen.getByText("Services").closest("fieldset")
    expect(serviceFieldset).not.toBeNull()
    expect(within(serviceFieldset as HTMLElement).getAllByRole("radio")).toHaveLength(2)

    // Switch to Cassie — different services
    await userEvent.click(screen.getByLabelText(/Cassie/i))

    await waitFor(() => {
      const radios = within(serviceFieldset as HTMLElement).getAllByRole("radio")
      expect(radios).toHaveLength(2)
    })

    expect(screen.queryByText("Signature Cut")).not.toBeInTheDocument()
    expect(screen.getByText("Color Session")).toBeInTheDocument()
    expect(screen.getByText("Style Finish")).toBeInTheDocument()
  })

  it("restores all services when No preference is selected again", async () => {
    renderRequestRenderer(buildWaitlistSpec())

    await userEvent.click(screen.getByLabelText(/Enzo/i))
    await waitFor(() => {
      expect(screen.getByText("Services")).toBeInTheDocument()
    })

    const serviceFieldset = screen.getByText("Services").closest("fieldset")
    expect(serviceFieldset).not.toBeNull()

    await userEvent.click(screen.getByLabelText(/Cassie/i))
    await waitFor(() => {
      expect(within(serviceFieldset as HTMLElement).getAllByRole("radio")).toHaveLength(2)
    })

    await userEvent.click(screen.getByLabelText(/No preference/i))

    await waitFor(() => {
      expect(within(serviceFieldset as HTMLElement).getAllByRole("radio")).toHaveLength(3)
    })

    expect(screen.getByText("Signature Cut")).toBeInTheDocument()
    expect(screen.getByText("Color Session")).toBeInTheDocument()
    expect(screen.getByText("Style Finish")).toBeInTheDocument()
  })

  it("submits valid waitlist data and shows the success state", async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse({ ok: true }, true, 201))

    renderRequestRenderer(buildWaitlistSpec())

    await userEvent.click(screen.getByLabelText(/Enzo/i))
    await userEvent.click(screen.getByRole("radio", { name: /Signature Cut/i }))
    await userEvent.click(screen.getByRole("button", { name: "Pick availability" }))

    await userEvent.type(screen.getByLabelText(/^Name/i), "Taylor Client")
    await userEvent.tab()
    await userEvent.type(screen.getByLabelText(/^Email/i), "taylor@example.com")
    await userEvent.tab()
    await userEvent.type(screen.getByLabelText(/^Phone/i), "4255550101")
    await userEvent.tab()

    await userEvent.click(screen.getByRole("button", { name: "Join Waitlist" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/booking/waitlist",
        expect.objectContaining({
          method: "POST",
        })
      )
    })
    expect(
      await screen.findByRole("heading", { name: "You're on the waitlist!" })
    ).toBeInTheDocument()
  })

  it("submits linked waitlist token without requiring public contact fields", async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse({ ok: true }, true, 201))

    renderRequestRenderer(buildWaitlistSpec({
      waitlistLinkToken: "raw-token",
    }), { waitlistLinkToken: "raw-token" })

    expect(screen.queryByLabelText(/^Name/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^Email/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^Phone/i)).not.toBeInTheDocument()

    await userEvent.click(screen.getByLabelText(/Enzo/i))
    await userEvent.click(screen.getByRole("radio", { name: /Signature Cut/i }))
    await userEvent.click(screen.getByRole("button", { name: "Pick availability" }))
    await userEvent.click(screen.getByRole("button", { name: "Join Waitlist" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/booking/waitlist",
        expect.objectContaining({
          body: expect.stringContaining("\"waitlistLinkToken\":\"raw-token\""),
        })
      )
    })
  })

  it("submits waitlist data even when fields have not blurred", async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse({ ok: true }, true, 201))

    renderRequestRenderer(buildWaitlistSpec())

    await userEvent.click(screen.getByLabelText(/Enzo/i))
    await userEvent.click(screen.getByRole("radio", { name: /Signature Cut/i }))
    await userEvent.click(screen.getByRole("button", { name: "Pick availability" }))

    await userEvent.type(screen.getByLabelText(/^Name/i), "Taylor Client")
    await userEvent.type(screen.getByLabelText(/^Email/i), "taylor@example.com")
    await userEvent.type(screen.getByLabelText(/^Phone/i), "4255550101")

    await userEvent.click(screen.getByRole("button", { name: "Join Waitlist" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/booking/waitlist",
        expect.objectContaining({
          method: "POST",
        })
      )
    })
    expect(
      await screen.findByRole("heading", { name: "You're on the waitlist!" })
    ).toBeInTheDocument()
  })

  it("submits waitlist data when contact fields are browser-filled without React change events", async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse({ ok: true }, true, 201))

    renderRequestRenderer(buildWaitlistSpec())

    await userEvent.click(screen.getByLabelText(/Enzo/i))
    await userEvent.click(screen.getByRole("radio", { name: /Signature Cut/i }))
    await userEvent.click(screen.getByRole("button", { name: "Pick availability" }))

    const nameInput = screen.getByLabelText(/^Name/i) as HTMLInputElement
    const emailInput = screen.getByLabelText(/^Email/i) as HTMLInputElement
    const phoneInput = screen.getByLabelText(/^Phone/i) as HTMLInputElement

    nameInput.value = "Daniel Griffin"
    emailInput.value = "danielsgriffin@gmail.com"
    phoneInput.value = "4253083312"

    await userEvent.click(screen.getByRole("button", { name: "Join Waitlist" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/booking/waitlist",
        expect.objectContaining({
          method: "POST",
        })
      )
    })
    expect(
      await screen.findByRole("heading", { name: "You're on the waitlist!" })
    ).toBeInTheDocument()
  })

  it("disables submit button until availability is selected", async () => {
    renderRequestRenderer(buildWaitlistSpec())

    await userEvent.click(screen.getByLabelText(/Enzo/i))
    await userEvent.click(screen.getByRole("radio", { name: /Signature Cut/i }))

    // Button should be disabled before availability is picked
    expect(screen.getByRole("button", { name: "Join Waitlist" })).toBeDisabled()

    // Pick availability
    await userEvent.click(screen.getByRole("button", { name: "Pick availability" }))

    // Button should now be enabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Join Waitlist" })).toBeEnabled()
    })
  })

  it("shows the required email validation error before submitting", async () => {
    renderRequestRenderer(buildWaitlistSpec())

    await userEvent.click(screen.getByLabelText(/Enzo/i))
    await userEvent.click(screen.getByRole("radio", { name: /Signature Cut/i }))
    await userEvent.click(screen.getByRole("button", { name: "Pick availability" }))
    await userEvent.type(screen.getByLabelText(/^Name/i), "Taylor Client")
    await userEvent.tab()

    await userEvent.click(screen.getByRole("button", { name: "Join Waitlist" }))

    expect(
      await screen.findByText("Please enter your email.")
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("shows the loading state while the waitlist submission is pending", async () => {
    const response = createDeferred<Response>()
    fetchMock.mockReturnValueOnce(response.promise)

    renderRequestRenderer(buildWaitlistSpec())

    await userEvent.click(screen.getByLabelText(/Enzo/i))
    await userEvent.click(screen.getByRole("radio", { name: /Signature Cut/i }))
    await userEvent.click(screen.getByRole("button", { name: "Pick availability" }))
    await userEvent.type(screen.getByLabelText(/^Name/i), "Taylor Client")
    await userEvent.tab()
    await userEvent.type(screen.getByLabelText(/^Email/i), "taylor@example.com")
    await userEvent.tab()

    await userEvent.click(screen.getByRole("button", { name: "Join Waitlist" }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Joining Waitlist..." })).toBeDisabled()
    })
    expect(screen.getByText("Saving your spot...")).toBeInTheDocument()

    response.resolve(createFetchResponse({ ok: true }, true, 201))

    expect(
      await screen.findByRole("heading", { name: "You're on the waitlist!" })
    ).toBeInTheDocument()
  })
})
