"use server"

import { revalidatePath } from "next/cache"

export async function selectSiteVariantAction(shopSlug: string, variantId: string, reviewerName: string | null) {
  const apiBase = process.env.KOUREIA_API_URL
  if (!apiBase) return { ok: false, error: "KOUREIA_API_URL is not set" }

  const response = await fetch(
    `${apiBase}/api/shops/${encodeURIComponent(shopSlug)}/site-variants/${encodeURIComponent(variantId)}/select`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewerName }),
      cache: "no-store",
    },
  )
  const body = await response.json().catch(() => null) as { error?: string } | null
  if (!response.ok) return { ok: false, error: body?.error ?? "Failed to choose direction" }

  revalidatePath("/variants")
  return { ok: true }
}
