/**
 * SiteSpec — the full spec shape that drives tenant site rendering.
 *
 * In production, fetched from GET /api/shops/{slug}/site-spec on the main platform.
 */

export type SiteSpec = {
  shop: {
    name: string
    slug: string
    domain: string
    tagline?: string
    subTagline?: string
    description?: string
    originStory?: string
    brandPhilosophy?: string
    address?: string
    phone?: string
    email?: string
    timezone: string
    cancellationPolicy?: string
    birthdayPromo?: string
    giftCardUrl?: string
    googleReviewsUrl?: string
    mapCoordinates?: { lat: number; lng: number }
    paymentMethods: string[]
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
  featuredService?: {
    name: string
    headline: string
    description: string
  }
  testimonials: { name: string; text: string }[]
  /** Staff members with their services and individual hours */
  staff: SiteStaffMember[]
  /** Composite shop hours (earliest open → latest close across all staff) */
  hours: SiteHours[]
  waitlist?: {
    horizonDays?: number
  }
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
}

export type SiteStaffMember = {
  id?: string
  name: string
  role: string
  bio?: string
  specialties: string[]
  imageUrl?: string
  colorHex?: string
  services: SiteService[]
  hours: SiteHours[]
}

export type SiteHours = {
  dayOfWeek: number // 0=Sun, 6=Sat
  startTime: string // "09:00"
  endTime: string   // "17:00"
  isClosed: boolean
}

export type SiteSocialLink = {
  platform: string // "instagram", "facebook", "yelp", etc.
  url: string
}
