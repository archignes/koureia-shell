import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { resolveTenant, resolveSiteSpec } from "@/lib/tenant"
// import { SiteRenderer } from "@/components/site-renderer"
import { SiteRendererJR } from "@/components/site-renderer-jr"
import { BookingPage } from "@/components/site/booking-page"
import { getTheme } from "@/components/site/theme"
import { buildSiteSpec, type SiteSpec as JsonRenderSiteSpec } from "@/lib/json-render/load-spec"

type Props = {
  params: Promise<{ domain: string; slug?: string[] }>
}

export default async function TenantPage({ params }: Props) {
  const { domain, slug } = await params
  const headersList = await headers()

  // The domain comes from the middleware rewrite path param,
  // but double-check against the actual host header for safety.
  const host = headersList.get("host") ?? ""
  const normalizedHost = host.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "")
  const isLocalDev = normalizedHost === "localhost" || normalizedHost === "127.0.0.1"
  const tenantDomain = isLocalDev
    ? (domain.includes(".") ? domain : `${domain}.koureia.com`)
    : (normalizedHost || domain)

  const tenant = await resolveTenant(tenantDomain)

  if (!tenant) {
    notFound()
  }

  if (tenant.site_status === "deprovisioned") {
    return <DecommissionedPage name={tenant.name} />
  }

  if (tenant.site_status === "provisioning") {
    return <ProvisioningPage name={tenant.name} />
  }

  // Fetch the full site spec for rendering
  const spec = await resolveSiteSpec(tenant.slug)

  if (!spec) {
    // Spec not available yet — show minimal branded page
    return <PlaceholderPage tenant={tenant} />
  }

  // Route by slug — exact match only
  if (slug?.length === 1 && slug[0] === "book") {
    const theme = getTheme(spec.branding)
    return <BookingPage spec={spec} theme={theme} />
  }

  // Unknown slug → 404, root → landing page
  if (slug && slug.length > 0) {
    notFound()
  }

  try {
    const siteSpec = buildSiteSpec(spec as unknown as JsonRenderSiteSpec)
    return <SiteRendererJR spec={siteSpec} />
  } catch (error) {
    console.error("[koureia-shell] buildSiteSpec failed, falling back to legacy renderer:", error)
    const { SiteRenderer } = await import("@/components/site-renderer")
    return <SiteRenderer spec={spec} />
  }
}

// ── Fallback renders ─────────────────────────────────────────

function PlaceholderPage({ tenant }: { tenant: { name: string; domain: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1410] text-[#e8ddd0]">
      <h1 className="text-3xl font-bold text-[#c9a84c]">{tenant.name}</h1>
      <p className="mt-2 text-sm opacity-50">Site coming soon</p>
    </div>
  )
}

function ProvisioningPage({ name }: { name: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-400">
      <div className="space-y-2 text-center">
        <p className="text-stone-200">{name}</p>
        <p className="text-sm">This site is being set up. Check back soon.</p>
      </div>
    </div>
  )
}

function DecommissionedPage({ name }: { name: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-400">
      <div className="space-y-2 text-center">
        <p className="text-stone-200">{name}</p>
        <p className="text-sm">This site is no longer available.</p>
      </div>
    </div>
  )
}

// Generate metadata from tenant name
export async function generateMetadata({ params }: Props) {
  const { domain } = await params
  const tenant = await resolveTenant(domain)

  if (!tenant) {
    return { title: "Not Found" }
  }

  const spec = await resolveSiteSpec(tenant.slug)

  return {
    title: spec?.shop.tagline
      ? `${tenant.name} — ${spec.shop.tagline}`
      : tenant.name,
    description: spec?.shop.description,
  }
}
