import { renderTenantIntakeForm } from "../render-tenant-intake-form"

type Props = {
  params: Promise<{ domain: string; type: string }>
}

export default async function TenantIntakeFormPage({ params }: Props) {
  const { domain, type } = await params
  return renderTenantIntakeForm({ domain, type })
}
