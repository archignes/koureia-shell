import { renderTenantIntakeForm } from "../../render-tenant-intake-form"

type Props = {
  params: Promise<{ domain: string; shop: string; type: string }>
}

export default async function TenantShopIntakeFormPage({ params }: Props) {
  const { domain, shop, type } = await params
  return renderTenantIntakeForm({ domain, shop, type })
}
