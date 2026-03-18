/**
 * SiteSpec — the full spec shape that drives tenant site rendering.
 *
 * In production, fetched from GET /api/shops/{slug}/site-spec on the main platform.
 * In local dev, uses mock data from lib/mock-specs.ts.
 */

export type SiteSpec = {
  shop: {
    name: string
    slug: string
    domain: string
    tagline?: string
    description?: string
    address?: string
    phone?: string
    email?: string
    timezone: string
  }
  branding: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    textColor: string
    accentColor: string
    logoUrl?: string
    heroImageUrl?: string
    displayFont: string
    bodyFont: string
  }
  services: SiteService[]
  staff: SiteStaffMember[]
  hours: SiteHours[]
  social: SiteSocialLink[]
  bookingUrl: string
}

export type SiteService = {
  name: string
  description?: string
  category?: string
  durationMinutes: number
  priceCents: number
  priceDisplay?: string
  imageUrl?: string
}

export type SiteStaffMember = {
  name: string
  role: string
  bio?: string
  specialties: string[]
  imageUrl?: string
}

export type SiteHours = {
  dayOfWeek: number // 0=Sun, 6=Sat
  startTime: string // "09:00"
  endTime: string   // "17:00"
  isClosed: boolean
}

export type SiteSocialLink = {
  platform: string // "instagram", "facebook", "tiktok", etc.
  url: string
}
