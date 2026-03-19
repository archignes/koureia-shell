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

export async function resolveSiteSpec(slug: string): Promise<SiteSpec | null> {
  const apiBase = process.env.KOUREIA_API_URL

  if (!apiBase) {
    console.error("[koureia-shell] KOUREIA_API_URL is not set — cannot resolve site spec")
    return null
  }

  try {
    const res = await fetch(
      `${apiBase}/api/shops/${encodeURIComponent(slug)}/site-spec`,
      { next: { revalidate: 60 } }
    )
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return (await res.json()) as SiteSpec
  } catch (err) {
    console.error("[koureia-shell] resolveSiteSpec failed:", err)
    return null
  }
}
