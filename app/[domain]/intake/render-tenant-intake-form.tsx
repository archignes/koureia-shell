import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { createElement } from "react"

import { IntakeFormClient } from "@/components/intake/intake-form-client"
import { ErrorState } from "@/components/intake/intake-form-view"
import { fetchIntakeForm, resolveTenantDomain } from "@/lib/intake"
import { resolveTenant } from "@/lib/tenant"

export async function renderTenantIntakeForm({
  domain,
  shop,
  type,
  intakeLinkToken,
}: {
  domain: string
  shop?: string
  type: string
  intakeLinkToken?: string | null
}) {
  const headersList = await headers()
  const tenantDomain = resolveTenantDomain({ domainParam: domain, headersList })
  const tenant = await resolveTenant(tenantDomain)

  if (!tenant || tenant.site_status !== "live") {
    notFound()
  }

  if (shop && shop !== tenant.slug) {
    notFound()
  }

  const apiUrl = process.env.KOUREIA_API_URL ?? "https://koureia.com"

  try {
    const form = await fetchIntakeForm(apiUrl, tenant.slug, type, intakeLinkToken)
    if (!form) notFound()

    return createElement(IntakeFormClient, {
      form,
      intakeLinkToken,
      returnHref: `/${domain}`,
      tenantName: tenant.name,
    })
  } catch (error) {
    return createElement(ErrorState, {
      error: error instanceof Error ? error.message : "Failed to load intake form",
      href: `/${domain}`,
    })
  }
}
