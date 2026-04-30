export interface IntakeField {
  key: string
  type: "text" | "email" | "phone" | "textarea" | "radio" | "checkbox" | "select" | "photo" | "photo-selfie"
  label: string
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: string[]
}

export interface IntakeFormSummary {
  id: string
  title: string
  description: string | null
  form_type: string
  fields_json: IntakeField[]
}

export interface IntakeFormData extends IntakeFormSummary {
  shop_id: string
  linkedClient?: {
    displayName: string
  } | null
}

export function resolveTenantDomain({
  domainParam,
  headersList,
}: {
  domainParam: string
  headersList: Headers
}) {
  const host = headersList.get("host") ?? ""
  const normalizedHost = host.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "")
  const isLocalDev = normalizedHost === "localhost" || normalizedHost === "127.0.0.1"

  return isLocalDev
    ? (domainParam.includes(".") ? domainParam : `${domainParam}.koureia.com`)
    : (normalizedHost || domainParam)
}

export async function fetchIntakeForms(apiUrl: string, shopSlug: string): Promise<IntakeFormSummary[]> {
  const res = await fetch(
    `${apiUrl}/api/intake/forms?shop=${encodeURIComponent(shopSlug)}`,
    { next: { revalidate: 60 } },
  )

  if (res.status === 404) return []
  if (!res.ok) {
    throw new Error(`Failed to load intake forms (${res.status})`)
  }

  const body = await res.json() as { forms?: IntakeFormSummary[] }
  return body.forms ?? []
}

export async function fetchIntakeForm(apiUrl: string, shopSlug: string, formType: string, intakeLinkToken?: string | null): Promise<IntakeFormData | null> {
  const resolvedFormType = formType === "new-client" ? "new-client-cassie" : formType
  const query = new URLSearchParams({
    shop: shopSlug,
    type: resolvedFormType,
  })
  if (intakeLinkToken) query.set("ilt", intakeLinkToken)

  const res = await fetch(
    `${apiUrl}/api/intake/forms/resolve?${query.toString()}`,
    { cache: "no-store" },
  )

  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`Failed to resolve intake form (${res.status})`)
  }

  const body = await res.json() as { form?: IntakeFormData; linkedClient?: { displayName: string } | null }
  return body.form ? { ...body.form, linkedClient: body.linkedClient ?? null } : null
}
