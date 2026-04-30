import { notFound } from "next/navigation"

import { renderTenantIntakeForm } from "../render-tenant-intake-form"

type Props = {
  params: Promise<{ domain: string; segments: string[] }>
  searchParams?: Promise<{ ilt?: string }>
}

export default async function TenantIntakeFormPage({ params, searchParams }: Props) {
  const { domain, segments } = await params
  const intakeLinkToken = (await searchParams)?.ilt ?? null

  if (segments.length === 1) {
    return renderTenantIntakeForm({ domain, type: segments[0], intakeLinkToken })
  }

  if (segments.length === 2) {
    const [shop, type] = segments
    return renderTenantIntakeForm({ domain, shop, type, intakeLinkToken })
  }

  notFound()
}
