/**
 * Tenant resolution — maps a domain to a shop spec.
 *
 * Always calls the Koureia API. For local dev, run the koureia app
 * and set KOUREIA_API_URL=http://localhost:3000 in .env.local.
 */

import type { SiteSpec } from "./site-spec"

export type TenantSpec = {
  slug: string
  name: string
  domain: string
  site_status: "provisioning" | "live" | "error" | "deprovisioned"
  site_visibility: "private" | "preview" | "public"
  branding_json: unknown | null
}

export type SiteVariantSummary = {
  id: string
  name: string
  summary: string | null
  status: "draft" | "selected" | "finalized" | "archived"
  previewUrl: string
  created_at: string
}

// ── Resolver ──────────────────────────────────────────────────

export async function resolveTenant(domain: string): Promise<TenantSpec | null> {
  const apiBase = process.env.KOUREIA_API_URL

  if (!apiBase) {
    console.error("[koureia-shell] KOUREIA_API_URL is not set — cannot resolve tenants")
    return null
  }

  try {
    const res = await fetch(
      `${apiBase}/api/shops/by-domain?domain=${encodeURIComponent(domain)}`,
      { next: { revalidate: 60 } }
    )
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return (await res.json()) as TenantSpec
  } catch (err) {
    console.error("[koureia-shell] resolveTenant failed:", err)
    return null
  }
}

// ── Site Spec Resolver ────────────────────────────────────────

export async function resolveSiteSpec(slug: string, siteVariant?: string): Promise<SiteSpec | null> {
  const apiBase = process.env.KOUREIA_API_URL

  if (!apiBase) {
    console.error("[koureia-shell] KOUREIA_API_URL is not set — cannot resolve site spec")
    return null
  }

  try {
    const params = new URLSearchParams()
    if (siteVariant) params.set("siteVariant", siteVariant)
    const query = params.size > 0 ? `?${params.toString()}` : ""
    const res = await fetch(
      `${apiBase}/api/shops/${encodeURIComponent(slug)}/site-spec${query}`,
      siteVariant ? { cache: "no-store" } : { next: { revalidate: 60 } }
    )
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return (await res.json()) as SiteSpec
  } catch (err) {
    console.error("[koureia-shell] resolveSiteSpec failed:", err)
    return null
  }
}

export async function resolveSiteVariants(slug: string): Promise<SiteVariantSummary[]> {
  const apiBase = process.env.KOUREIA_API_URL
  if (!apiBase) return []

  try {
    const res = await fetch(
      `${apiBase}/api/shops/${encodeURIComponent(slug)}/site-variants`,
      { cache: "no-store" },
    )
    if (!res.ok) return []
    const body = await res.json() as { variants?: SiteVariantSummary[] }
    return body.variants ?? []
  } catch (err) {
    console.error("[koureia-shell] resolveSiteVariants failed:", err)
    return []
  }
}
