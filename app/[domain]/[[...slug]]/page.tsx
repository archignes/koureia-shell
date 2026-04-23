import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { resolveTenant, resolveSiteSpec, resolveSiteVariants, type SiteVariantSummary } from "@/lib/tenant"
// import { SiteRenderer } from "@/components/site-renderer"
import { SiteRendererJR } from "@/components/site-renderer-jr"
import { BookingPage } from "@/components/site/booking-page"
import { PreviewBanner } from "@/components/preview-banner"
import { getTheme } from "@/components/site/theme"
import { beautyAndTheBarberAssetCategories, beautyAndTheBarberAssets } from "@/lib/beauty-and-the-barber-assets"
import { buildSiteSpec, type SiteSpec as JsonRenderSiteSpec } from "@/lib/json-render/load-spec"
import type { SiteSpec } from "@/lib/site-spec"
import assetDescriptions from "@/public/assets/beauty-and-the-barber/descriptions.json"
import { selectSiteVariantAction } from "../variants/actions"

type Props = {
  params: Promise<{ domain: string; slug?: string[] }>
  searchParams?: Promise<{ siteVariant?: string; track?: "barber" | "beauty" }>
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

  if (isVariantsPath(slug)) {
    redirect(`${getKoureiaReviewOrigin()}/site/variants`)
  }

  if (isAssetsPath(slug)) {
    redirect(`${getKoureiaReviewOrigin()}/site/assets`)
  }

  const spec = await resolveSiteSpec(tenant.slug, query?.siteVariant)

  if (!spec) {
    // Spec not available yet — show minimal branded page
    return <PlaceholderPage tenant={tenant} />
  }

  // Route by slug — exact match only
  if (slug?.length === 1 && slug[0] === "book") {
    const theme = getTheme(spec.branding)
    return <BookingPage initialTrack={query?.track} siteVariantId={query?.siteVariant} spec={spec} theme={theme} />
  }

  // Unknown slug → 404, root → landing page
  if (slug && slug.length > 0) {
    notFound()
  }

  const previewVariantName = query?.siteVariant
    ? await resolvePreviewVariantName(tenant.slug, query.siteVariant)
    : null

  try {
    const siteSpec = buildSiteSpec(spec as unknown as JsonRenderSiteSpec)
    return (
      <>
        {previewVariantName ? <PreviewBanner variantName={previewVariantName} /> : null}
        <SiteRendererJR spec={siteSpec} />
      </>
    )
  } catch (error) {
    console.error("[koureia-shell] buildSiteSpec failed, falling back to legacy renderer:", error)
    const { SiteRenderer } = await import("@/components/site-renderer")
    return (
      <>
        {previewVariantName ? <PreviewBanner variantName={previewVariantName} /> : null}
        <SiteRenderer spec={spec} />
      </>
    )
  }
}

async function resolvePreviewVariantName(shopSlug: string, variantId: string) {
  const variants = await resolveSiteVariants(shopSlug)
  return variants.find((variant) => variant.id === variantId)?.name ?? "site"
}

// ── Fallback renders ─────────────────────────────────────────

function PlaceholderPage({ tenant }: { tenant: { name: string; domain: string } }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#1a1410] text-[#e8ddd0]">
      <h1 className="text-3xl font-bold text-[#c9a84c]">{tenant.name}</h1>
      <p className="mt-2 text-sm opacity-50">Site coming soon</p>
    </div>
  )
}

function ProvisioningPage({ name }: { name: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-stone-950 text-stone-400">
      <div className="space-y-2 text-center">
        <p className="text-stone-200">{name}</p>
        <p className="text-sm">This site is being set up. Check back soon.</p>
      </div>
    </div>
  )
}

function DecommissionedPage({ name }: { name: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-stone-950 text-stone-400">
      <div className="space-y-2 text-center">
        <p className="text-stone-200">{name}</p>
        <p className="text-sm">This site is no longer available.</p>
      </div>
    </div>
  )
}

function _VariantChooserPage({
  shopSlug,
  tenant,
  variants,
  variantSpecs,
  previewBasePath,
  siteBasePath,
}: {
  shopSlug: string
  tenant: { name: string }
  variants: SiteVariantSummary[]
  variantSpecs: Array<{ id: string; spec: SiteSpec | null }>
  previewBasePath: string
  siteBasePath: string
}) {
  const existingSiteUrl = "https://www.beautyandthebarbersalons.com/"

  return (
    <div className="min-h-dvh bg-[#1a1410] px-5 py-8 text-[#e8ddd0]">
      <main className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[#c9a84c]">Site Variants</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{tenant.name}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">
          Review each draft variant. Choosing a variant here is for discussion only; publishing still requires an explicit final approval step in Koureia.
        </p>
        <section className="mt-8 grid gap-5 border border-[#c9a84c]/20 bg-black/20 p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:p-5">
          <img
            alt="Beauty and the Barber current website reference"
            className="aspect-[16/10] w-full border border-[#c9a84c]/20 object-cover object-top"
            src="/reference/bbt-website-full.png"
          />
          <div className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a84c]">Existing page reference</p>
            <h2 className="mt-3 text-2xl font-medium">Actual assets and structure found from the earlier build</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              This is a local screenshot captured from their current public website. The cards below compare each variant against the existing Beauty and the Barber page elements we found, then call out the newer Koureia landing-page features each variant is using today.
            </p>
            <a
              className="mt-5 inline-flex w-fit border border-[#c9a84c]/40 px-4 py-2 text-sm text-[#c9a84c]"
              href={existingSiteUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open existing website
            </a>
          </div>
        </section>
        <AssetLibrarySection assetsHref={`${siteBasePath}/assets`} />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {variants.map((variant) => {
            const previewHref = `${previewBasePath}${variant.previewUrl}`
            const spec = variantSpecs.find((entry) => entry.id === variant.id)?.spec ?? null
            const checklist = getVariantChecklistGroups(spec)
            return (
              <article key={variant.id} className="overflow-hidden border border-[#c9a84c]/20 bg-black/20">
                <a
                  aria-label={`Preview ${variant.name}`}
                  className="group relative block aspect-[16/10] overflow-hidden border-b border-[#c9a84c]/20 bg-black"
                  href={previewHref}
                >
                  <iframe
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-0 h-[900px] w-[1440px] origin-top-left scale-[0.31] border-0 opacity-90 transition-opacity group-hover:opacity-100"
                    src={previewHref}
                    tabIndex={-1}
                    title={`${variant.name} homepage preview`}
                  />
                  <span className="absolute inset-0 bg-black/10" />
                </a>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-medium">{variant.name}</h2>
                    <span className="border border-stone-700 px-2 py-1 text-[11px] uppercase text-stone-400">
                      {variant.status}
                    </span>
                  </div>
                  {variant.summary ? (
                    <p className="mt-3 text-sm leading-6 text-stone-300">{variant.summary}</p>
                  ) : null}
                  <div className="mt-5 grid gap-4">
                    <ChecklistBlock title="Included from your existing page" items={checklist.existing} />
                    <ChecklistBlock title="New Koureia features included" items={checklist.newFeatures} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      className="inline-flex border border-[#c9a84c]/40 px-4 py-2 text-sm text-[#c9a84c]"
                      href={previewHref}
                    >
                      Preview variant
                    </a>
                    <form action={selectVariantFormAction}>
                      <input name="variantId" type="hidden" value={variant.id} />
                      <input name="shopSlug" type="hidden" value={shopSlug} />
                      <button
                        className="inline-flex bg-[#c9a84c] px-4 py-2 text-sm text-[#1a1410]"
                        type="submit"
                      >
                        Choose this variant
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {variants.length === 0 ? (
          <p className="mt-8 border border-stone-800 p-5 text-sm text-stone-400">
            No draft variants are available yet.
          </p>
        ) : null}
      </main>
    </div>
  )
}

function _AssetsLibraryPage({
  siteBasePath,
  tenant,
}: {
  siteBasePath: string
  tenant: { name: string }
}) {
  return (
    <div className="min-h-dvh bg-[#1a1410] px-5 py-8 text-[#e8ddd0]">
      <main className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#c9a84c]">Asset Library</p>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{tenant.name}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">
              Local copies of the Beauty and the Barber assets recovered from the earlier Curiosity Build, with Gemini-generated descriptions for selection and landing-page planning.
            </p>
          </div>
          <a
            className="inline-flex w-fit border border-[#c9a84c]/40 px-4 py-2 text-sm text-[#c9a84c]"
            href={`${siteBasePath}/variants`}
          >
            Back to variants
          </a>
        </div>
        <AssetLibrarySection showAll />
      </main>
    </div>
  )
}

function AssetLibrarySection({
  assetsHref,
  showAll = false,
}: {
  assetsHref?: string
  showAll?: boolean
}) {
  const previewAssets = showAll ? beautyAndTheBarberAssets : beautyAndTheBarberAssets.slice(0, 12)
  const descriptionsByFile = new Map(assetDescriptions.assets.map((asset) => [asset.file, asset]))

  return (
    <section className="mt-8 border border-[#c9a84c]/20 bg-black/20 p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#c9a84c]">Asset library</p>
          <h2 className="mt-3 text-2xl font-medium">Pulled from the earlier Curiosity Build</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
            These are the local copies of the Beauty and the Barber assets referenced by the earlier demo build in `cb/builds/beautyandthebarber`: logos, staff photos, beauty work, barber work, and interiors.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="w-fit border border-stone-700 px-3 py-2 text-xs uppercase text-stone-300">
            {beautyAndTheBarberAssets.length} assets
          </span>
          {assetsHref ? (
            <a
              className="inline-flex w-fit border border-[#c9a84c]/40 px-3 py-2 text-xs uppercase text-[#c9a84c]"
              href={assetsHref}
            >
              Open full library
            </a>
          ) : null}
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {beautyAndTheBarberAssetCategories.map((category) => (
          <div className="border border-stone-800 p-3" key={category.label}>
            <p className="text-sm font-medium text-stone-200">{category.label}</p>
            <p className="mt-1 text-xs text-stone-500">{category.files.length} files</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
        {previewAssets.map((asset) => {
          const description = descriptionsByFile.get(asset.file)
          return (
            <a
              className="group block overflow-hidden border border-stone-800 bg-black"
              href={asset.src}
              key={asset.file}
              rel="noreferrer"
              target="_blank"
            >
              <span className="block bg-[#e8ddd0]">
                <img
                  alt={description?.description ?? `${asset.label} asset from Beauty and the Barber`}
                  className="aspect-square w-full object-contain p-2 opacity-95 transition-opacity group-hover:opacity-100"
                  src={asset.src}
                />
              </span>
              <span className="block min-h-24 p-3">
                <span className="block text-xs font-medium text-stone-200">{description?.title ?? asset.label}</span>
                <span className="mt-1 block text-[11px] leading-4 text-stone-500">
                  {description?.description ?? "Gemini description pending."}
                </span>
              </span>
            </a>
          )
        })}
      </div>
    </section>
  )
}

type ChecklistItem = {
  label: string
  included: boolean
}

function ChecklistBlock({ title, items }: { title: string; items: ChecklistItem[] }) {
  return (
    <section className="border border-stone-800 p-3">
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-stone-300">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li className="flex items-start justify-between gap-3 text-sm" key={item.label}>
            <span className={item.included ? "text-stone-200" : "text-stone-500"}>{item.label}</span>
            <span
              className={
                item.included
                  ? "shrink-0 border border-[#c9a84c]/50 px-2 py-0.5 text-[11px] uppercase text-[#c9a84c]"
                  : "shrink-0 border border-stone-800 px-2 py-0.5 text-[11px] uppercase text-stone-500"
              }
            >
              {item.included ? "Included" : "Not yet"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function getVariantChecklistGroups(spec: SiteSpec | null) {
  const staff = spec?.staff ?? []
  const services = getServices(spec)
  const social = spec?.social ?? []

  return {
    existing: [
      { label: "Logo or brand mark", included: hasText(spec?.branding?.logoUrl) },
      { label: "Social links", included: social.length > 0 },
      { label: "Booking call to action", included: hasText(spec?.bookingUrl) },
      { label: "About or brand story copy", included: hasText(spec?.shop.brandPhilosophy) || hasText(spec?.shop.originStory) || hasText(spec?.shop.description) },
      { label: "Services section", included: services.length > 0 },
      { label: "Portfolio or image-led section", included: hasRealImagery(spec) },
      { label: "Location and address", included: hasText(spec?.shop.address) },
      { label: "Luxury for All style headline", included: hasText(spec?.shop.tagline) },
    ],
    newFeatures: [
      { label: "Provider cards", included: staff.length > 0 },
      { label: "Provider specialties", included: staff.some((member) => (member.specialties?.length ?? 0) > 0) },
      { label: "Service category summary", included: getServiceCategories(services).size > 0 },
      { label: "Featured service spotlight", included: Boolean(spec?.featuredService) },
      { label: "Split Beauty / Barber entry", included: spec?.landingMode === "split_door" && Boolean(spec?.splitDoor) },
      { label: "Testimonials", included: (spec?.testimonials?.length ?? 0) > 0 },
      { label: "Origin story section", included: hasText(spec?.shop.originStory) },
      { label: "Brand philosophy section", included: hasText(spec?.shop.brandPhilosophy) },
      { label: "Hours and contact section", included: (spec?.hours?.length ?? 0) > 0 || hasContact(spec) },
      { label: "Policies, gift cards, or review links", included: hasPolicyInfo(spec) },
      { label: "Payment methods", included: (spec?.shop.paymentMethods?.length ?? 0) > 0 },
      { label: "Portfolio gallery", included: (spec?.portfolioImages?.length ?? 0) > 0 },
      { label: "Real imagery in the variant", included: hasRealImagery(spec) },
    ],
  }
}

function getServices(spec: SiteSpec | null) {
  return spec?.staff.flatMap((member) => member.services) ?? []
}

function getServiceCategories(services: ReturnType<typeof getServices>) {
  return new Set(services.map((service) => service.category?.trim()).filter(Boolean))
}

function hasRealImagery(spec: SiteSpec | null) {
  return Boolean(
      hasText(spec?.branding?.logoUrl) ||
      hasText(spec?.branding?.heroImageUrl) ||
      (spec?.portfolioImages?.length ?? 0) > 0 ||
      spec?.staff.some((member) => hasText(member.imageUrl)),
  )
}

function hasContact(spec: SiteSpec | null) {
  return Boolean(
    hasText(spec?.shop.phone) ||
      hasText(spec?.shop.email) ||
      hasText(spec?.shop.address) ||
      (spec?.social?.length ?? 0) > 0,
  )
}

function hasPolicyInfo(spec: SiteSpec | null) {
  return Boolean(
    hasText(spec?.shop.cancellationPolicy) ||
      hasText(spec?.shop.birthdayPromo) ||
      hasText(spec?.shop.giftCardUrl) ||
      hasText(spec?.shop.googleReviewsUrl),
  )
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isVariantsPath(slug: string[] | undefined) {
  return Boolean(
    (slug?.length === 1 && slug[0] === "variants") ||
      (slug?.length === 2 && slug[0] === "site" && slug[1] === "variants"),
  )
}

function isAssetsPath(slug: string[] | undefined) {
  return Boolean(
    (slug?.length === 1 && slug[0] === "assets") ||
      (slug?.length === 2 && slug[0] === "site" && slug[1] === "assets"),
  )
}

function getKoureiaReviewOrigin() {
  return process.env.KOUREIA_REVIEW_ORIGIN ?? "https://koureia.com"
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
