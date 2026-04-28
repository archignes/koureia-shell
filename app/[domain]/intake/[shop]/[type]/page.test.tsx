import { render, screen } from "@testing-library/react"
import { createElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import TenantIntakeFormPage from "./page"

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ host: "danthebarberman.koureia.com" })),
}))

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

vi.mock("@/lib/tenant", () => ({
  resolveTenant: vi.fn(async () => ({
    name: "Dan the Barber Man",
    slug: "dan-the-barber-man",
    site_status: "live",
  })),
}))

vi.mock("@/lib/intake", async (importOriginal) => {
  const actual = await importOriginal()
  const intakeModule = actual as typeof import("@/lib/intake")
  return {
    ...intakeModule,
    fetchIntakeForm: vi.fn(async () => ({
      id: "form-1",
      shop_id: "shop-1",
      title: "Barber Intake",
      description: null,
      form_type: "barber",
      fields_json: [],
    })),
  }
})

vi.mock("@/components/intake/intake-form-client", () => ({
  IntakeFormClient: (props: {
    form: { title: string }
    returnHref: string
    tenantName: string
  }) => createElement(
    "main",
    null,
    createElement("h1", null, props.form.title),
    createElement("p", null, props.tenantName),
    createElement("a", { href: props.returnHref }, "Back"),
  ),
}))

vi.mock("@/components/intake/intake-form-view", () => ({
  ErrorState: (props: { error: string; href: string }) => createElement(
    "a",
    { href: props.href },
    props.error,
  ),
}))

describe("tenant intake form route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders intake SMS links with /intake/:shop/:type path shape", async () => {
    const page = await TenantIntakeFormPage({
      params: Promise.resolve({
        domain: "danthebarberman.koureia.com",
        shop: "dan-the-barber-man",
        type: "barber",
      }),
    })

    render(page)

    expect(screen.getByRole("heading", { name: "Barber Intake" })).toBeTruthy()
    expect(screen.getByText("Dan the Barber Man")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe(
      "/danthebarberman.koureia.com",
    )
  })
})
