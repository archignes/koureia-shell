import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { resolveTenant, resolveSiteSpec, resolveSiteVariants, type SiteVariantSummary } from "@/lib/tenant"
// import { SiteRenderer } from "@/components/site-renderer"
import { SiteRendererJR } from "@/components/site-renderer-jr"
import { BookingPage } from "@/components/site/booking-page"
import { getTheme } from "@/components/site/theme"
import { buildSiteSpec, type SiteSpec as JsonRenderSiteSpec } from "@/lib/json-render/load-spec"
import { selectSiteVariantAction } from "../variants/actions"

type Props = {
  params: Promise<{ domain: string; slug?: string[] }>
  searchParams?: Promise<{ siteVariant?: string }>
}

export default async function TenantPage({ params, searchParams }: Props) {
  const { domain, slug } = await params
  const query = await searchParams
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
  if (slug?.length === 1 && slug[0] === "variants") {
    const variants = await resolveSiteVariants(tenant.slug)
    return <VariantChooserPage shopSlug={tenant.slug} tenant={tenant} variants={variants} />
  }

  const spec = await resolveSiteSpec(tenant.slug, query?.siteVariant)

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

function VariantChooserPage({
  shopSlug,
  tenant,
  variants,
}: {
  shopSlug: string
  tenant: { name: string }
  variants: SiteVariantSummary[]
}) {
  return (
    <div className="min-h-screen bg-[#1a1410] px-5 py-8 text-[#e8ddd0]">
      <main className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[#c9a84c]">Site Directions</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{tenant.name}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">
          Review each draft direction. Choosing a direction here is for discussion only; publishing still requires an explicit final approval step in Koureia.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {variants.map((variant) => (
            <article key={variant.id} className="border border-[#c9a84c]/20 bg-black/20 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-medium">{variant.name}</h2>
                <span className="border border-stone-700 px-2 py-1 text-[11px] uppercase text-stone-400">
                  {variant.status}
                </span>
              </div>
              {variant.summary ? (
                <p className="mt-3 text-sm leading-6 text-stone-300">{variant.summary}</p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  className="inline-flex border border-[#c9a84c]/40 px-4 py-2 text-sm text-[#c9a84c]"
                  href={variant.previewUrl}
                >
                  Preview direction
                </a>
                <form action={selectVariantFormAction}>
                  <input name="variantId" type="hidden" value={variant.id} />
                  <input name="shopSlug" type="hidden" value={shopSlug} />
                  <button
                    className="inline-flex bg-[#c9a84c] px-4 py-2 text-sm text-[#1a1410]"
                    type="submit"
                  >
                    Choose this direction
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
        {variants.length === 0 ? (
          <p className="mt-8 border border-stone-800 p-5 text-sm text-stone-400">
            No draft directions are available yet.
          </p>
        ) : null}
      </main>
    </div>
  )
}

async function selectVariantFormAction(formData: FormData) {
  "use server"

  const shopSlug = String(formData.get("shopSlug") ?? "")
  const variantId = String(formData.get("variantId") ?? "")
  await selectSiteVariantAction(shopSlug, variantId, "demo-site reviewer")
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
