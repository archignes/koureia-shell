import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { resolveTenant } from "@/lib/tenant"

type Props = {
  params: Promise<{ domain: string; slug?: string[] }>
}

export default async function TenantPage({ params }: Props) {
  const { domain } = await params
  const headersList = await headers()

  // The domain comes from the middleware rewrite path param,
  // but double-check against the actual host header for safety.
  const host = headersList.get("host") ?? ""
  const normalizedHost = host.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "")

  const tenant = await resolveTenant(normalizedHost || domain)

  if (!tenant) {
    notFound()
  }

  if (tenant.site_status === "deprovisioned") {
    return <DecommissionedPage name={tenant.name} />
  }

  if (tenant.site_status === "provisioning") {
    return <ProvisioningPage name={tenant.name} />
  }

  // Phase 1: placeholder shell branded per tenant
  // Phase 2: replace with <Renderer spec={tenant.spec} registry={registry} />
  return <TenantShell tenant={tenant} />
}

// ── Phase 1 placeholder renders ──────────────────────────────

const DEFAULT_BRANDING = {
  primaryColor: "#c9a84c",
  backgroundColor: "#1a1410",
  textColor: "#e8ddd0",
  displayFont: "Playfair Display",
}

function TenantShell({ tenant }: { tenant: Awaited<ReturnType<typeof resolveTenant>> & object }) {
  const { name, domain } = tenant!
  const branding = DEFAULT_BRANDING

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: branding.backgroundColor,
        color: branding.textColor,
        fontFamily: `'${branding.displayFont}', serif`,
      }}
    >
      <header
        className="border-b px-6 py-4"
        style={{ borderColor: `${branding.primaryColor}30` }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xl font-semibold" style={{ color: branding.primaryColor }}>
            {name}
          </span>
          <span className="font-mono text-xs opacity-40">{domain}</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-lg space-y-4 text-center">
          <h1 className="text-4xl font-bold" style={{ color: branding.primaryColor }}>
            {name}
          </h1>
          <p className="text-sm opacity-60">
            Tenant shell — routing confirmed. Spec renderer coming next.
          </p>
          <div
            className="mt-6 rounded-xl border p-4 font-mono text-xs opacity-40"
            style={{ borderColor: `${branding.primaryColor}20` }}
          >
            <p>domain: {domain}</p>
            <p>status: live</p>
            <p>spec: not yet wired</p>
          </div>
        </div>
      </main>
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

// Generate a 404 page for unknown domains
export async function generateMetadata({ params }: Props) {
  const { domain } = await params
  const tenant = await resolveTenant(domain)
  return {
    title: tenant?.name ?? "Not Found",
  }
}
