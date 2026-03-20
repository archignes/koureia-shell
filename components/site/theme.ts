import type { SiteSpec } from "@/lib/site-spec"

export type Theme = {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  accentColor: string
  displayFont: string
  bodyFont: string
  logoUrl?: string
  heroImageUrl?: string
}

export function getTheme(branding: SiteSpec["branding"]): Theme {
  const displayFont = branding.displayFont || "Playfair Display"
  const bodyFont = branding.bodyFont || "Inter"

  return {
    ...branding,
    primaryColor: branding.primaryColor || "#c9a84c",
    secondaryColor: branding.secondaryColor || "#241b15",
    backgroundColor: branding.backgroundColor || "#1a1410",
    textColor: branding.textColor || "#e8ddd0",
    accentColor: branding.accentColor || "#c9a84c",
    displayFont: `'${displayFont}', Georgia, serif`,
    bodyFont: `'${bodyFont}', sans-serif`,
  }
}

export function getMapsUrl(shop: SiteSpec["shop"]) {
  if (shop.mapCoordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${shop.mapCoordinates.lat},${shop.mapCoordinates.lng}`
  }
  if (shop.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`
  }
  return null
}
