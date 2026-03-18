/**
 * Tenant resolution — maps a domain to a shop spec.
 *
 * Calls the Koureia internal API. Falls back to mock data in local dev
 * when KOUREIA_API_URL is not set.
 */

export type TenantSpec = {
  slug: string
  name: string
  domain: string
  site_status: "provisioning" | "live" | "error" | "deprovisioned"
  site_visibility: "private" | "preview" | "public"
  branding_json: unknown | null
}

// ── Mock (local dev only) ─────────────────────────────────────

const MOCK_TENANTS: Record<string, TenantSpec> = {
  "beautyandthebarber.koureia.com": {
    slug: "beauty-and-the-barber",
    name: "Beauty and the Barber",
    domain: "beautyandthebarber.koureia.com",
    site_status: "live",
    site_visibility: "public",
    branding_json: null,
  },
  "olliemay.koureia.com": {
    slug: "olliemay",
    name: "Ollie May Hair",
    domain: "olliemay.koureia.com",
    site_status: "live",
    site_visibility: "public",
    branding_json: null,
  },
}

// ── Resolver ──────────────────────────────────────────────────

export async function resolveTenant(domain: string): Promise<TenantSpec | null> {
  const apiBase = process.env.KOUREIA_API_URL

  if (!apiBase) {
    // Local dev fallback
    return MOCK_TENANTS[domain] ?? null
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
