import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { IntakeFormClient } from "@/components/intake/intake-form-client"
import { ErrorState } from "@/components/intake/intake-form-view"
import { fetchIntakeForm, resolveTenantDomain } from "@/lib/intake"
import { resolveTenant } from "@/lib/tenant"

type Props = {
  params: Promise<{ domain: string; type: string }>
}

export default async function TenantIntakeFormPage({ params }: Props) {
  const { domain, type } = await params
  const headersList = await headers()
  const tenantDomain = resolveTenantDomain({ domainParam: domain, headersList })
  const tenant = await resolveTenant(tenantDomain)

  if (!tenant || tenant.site_status !== "live") {
    notFound()
  }

  const apiUrl = process.env.KOUREIA_API_URL ?? "https://koureia.com"

  try {
    const form = await fetchIntakeForm(apiUrl, tenant.slug, type)
    if (!form) notFound()

    return (
      <IntakeFormClient
        form={form}
        returnHref={`/${domain}`}
        tenantName={tenant.name}
      />
    )
  } catch (error) {
    return (
      <ErrorState
        error={error instanceof Error ? error.message : "Failed to load intake form"}
        href={`/${domain}`}
      />
    )
  }
}
