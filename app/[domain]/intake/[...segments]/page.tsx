import { notFound } from "next/navigation"

import { renderTenantIntakeForm } from "../render-tenant-intake-form"

type Props = {
  params: Promise<{ domain: string; segments: string[] }>
}

export default async function TenantIntakeFormPage({ params }: Props) {
  const { domain, segments } = await params

  if (segments.length === 1) {
    return renderTenantIntakeForm({ domain, type: segments[0] })
  }

  if (segments.length === 2) {
    const [shop, type] = segments
    return renderTenantIntakeForm({ domain, shop, type })
  }

  notFound()
}
