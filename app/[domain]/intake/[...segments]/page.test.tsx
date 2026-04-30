import { cleanup, render, screen } from "@testing-library/react"
import { createElement } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { KO_KS_PUBLIC_CONTRACT } from "@/lib/ko-ks-public-contract"
import type * as IntakeModule from "@/lib/intake"

import TenantIntakeFormPage from "./page"

const { fetchIntakeFormMock, notFoundMock } = vi.hoisted(() => ({
  fetchIntakeFormMock: vi.fn(async (_apiUrl: string, _shop: string, type: string) => ({
    id: `form-${type}`,
    shop_id: "shop-1",
    title: `Intake ${type}`,
    description: null,
    form_type: type,
    fields_json: [],
  })),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ host: KO_KS_PUBLIC_CONTRACT.intake.tenantDomain })),
}))

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}))

vi.mock("@/lib/tenant", () => ({
  resolveTenant: vi.fn(async () => ({
    name: "Beauty and the Barber",
    slug: KO_KS_PUBLIC_CONTRACT.intake.shopSlug,
    site_status: "live",
  })),
}))

vi.mock("@/lib/intake", async (importOriginal) => {
  const actual = await importOriginal()
  const intakeModule = actual as typeof IntakeModule
  return {
    ...intakeModule,
    fetchIntakeForm: fetchIntakeFormMock,
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

describe("tenant intake catch-all route contract", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it.each(KO_KS_PUBLIC_CONTRACT.intake.generatedPaths)(
    "serves KO-generated intake path %s",
    async (path) => {
      const type = path.replace("/intake/", "")

      const page = await TenantIntakeFormPage({
        params: Promise.resolve({
          domain: KO_KS_PUBLIC_CONTRACT.intake.tenantDomain,
          segments: [type],
        }),
      })

      render(page)

      expect(screen.getByRole("heading", { name: `Intake ${type}` })).toBeTruthy()
      expect(fetchIntakeFormMock).toHaveBeenCalledWith(
        expect.any(String),
        KO_KS_PUBLIC_CONTRACT.intake.shopSlug,
        type,
        null,
      )
    },
  )

  it.each(KO_KS_PUBLIC_CONTRACT.intake.legacySupportedPaths)(
    "keeps legacy intake SMS path supported: %s",
    async (path) => {
      const [, , shop, type] = path.split("/")

      const page = await TenantIntakeFormPage({
        params: Promise.resolve({
          domain: KO_KS_PUBLIC_CONTRACT.intake.tenantDomain,
          segments: [shop, type],
        }),
      })

      render(page)

      expect(screen.getByRole("heading", { name: `Intake ${type}` })).toBeTruthy()
      expect(fetchIntakeFormMock).toHaveBeenCalledWith(
        expect.any(String),
        KO_KS_PUBLIC_CONTRACT.intake.shopSlug,
        type,
        null,
      )
    },
  )

  it("passes the client-specific intake token through to KO", async () => {
    const page = await TenantIntakeFormPage({
      params: Promise.resolve({
        domain: KO_KS_PUBLIC_CONTRACT.intake.tenantDomain,
        segments: ["new-client-cassie"],
      }),
      searchParams: Promise.resolve({ ilt: "raw-token" }),
    })

    render(page)

    expect(screen.getByRole("heading", { name: "Intake new-client-cassie" })).toBeTruthy()
    expect(fetchIntakeFormMock).toHaveBeenCalledWith(
      expect.any(String),
      KO_KS_PUBLIC_CONTRACT.intake.shopSlug,
      "new-client-cassie",
      "raw-token",
    )
  })

  it("404s malformed intake paths instead of rewriting forever", async () => {
    await expect(
      TenantIntakeFormPage({
        params: Promise.resolve({
          domain: KO_KS_PUBLIC_CONTRACT.intake.tenantDomain,
          segments: ["too", "many", "segments"],
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND")

    expect(notFoundMock).toHaveBeenCalled()
  })
})
