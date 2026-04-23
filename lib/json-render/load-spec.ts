import type { Spec } from "@json-render/core"

type BrandingJSON = {
  logo_url?: string
  hero_image_url?: string
  tagline?: string
  sub_tagline?: string
  description?: string
  cancellation_policy?: string
}

type SplitDoorPanel = {
  label: string
  href: string
  body?: string
  imageUrl?: string
}

type SplitDoorConfig = {
  address?: string
  eyebrow?: string
  left: SplitDoorPanel
  logoUrl?: string
  phone?: string
  prompt?: string
  right: SplitDoorPanel
  tagline?: string
}

type BrandingTheme = {
  logoUrl?: string
  heroImageUrl?: string
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  accentColor?: string
  displayFont?: string
  bodyFont?: string
}

export interface SiteSpec {
  shop: {
    id?: string
    name: string
    slug: string
    domain?: string
    tagline?: string
    subTagline?: string
    description?: string
    originStory?: string
    brandPhilosophy?: string
    cancellationPolicy?: string
    branding_json?: BrandingJSON | null
    address?: string | null
    phone?: string | null
    email?: string | null
    timezone: string
    birthdayPromo?: string
    giftCardUrl?: string
    googleReviewsUrl?: string
    mapCoordinates?: { lat: number; lng: number } | null
    paymentMethods?: string[]
  }
  branding?: BrandingTheme
  featuredService?: {
    name: string
    headline: string
    description: string
  }
  landingMode?: string | null
  portfolioImages?: string[]
  splitDoor?: SplitDoorConfig | null
  testimonials?: Array<{ name: string; text: string }>
  staff: Array<{
    id?: string
    name: string
    role: string | null
    photo_url?: string | null
    imageUrl?: string | null
    bio: string | null
    specialties?: string[]
    colorHex?: string | null
    services: Array<string | NormalizedService>
  }>
  services?: NormalizedService[]
  hours: Array<{
    staff_name?: string
    staffName?: string
    day_of_week?: number
    dayOfWeek?: number
    start_time?: string
    startTime?: string
    end_time?: string
    endTime?: string
  }>
  social?: Array<{ platform: string; url: string }>
  bookingUrl?: string
}

type NormalizedService = {
  id?: string
  name: string
  category?: string | null
  duration_minutes?: number
  durationMinutes?: number
  price_cents?: number
  priceCents?: number
  description?: string | null
}

type ElementSpec = {
  type: string
  props: Record<string, unknown>
  children?: string[]
}

type InfoGridItem = { label: string; body?: string; href?: string; linkText?: string }

type SpecShape = {
  root: string
  elements: Record<string, ElementSpec>
}

const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6]

export function buildSiteSpec(siteSpec: SiteSpec): Spec {
  const elements: Record<string, ElementSpec> = {}
  const children: string[] = []
  const branding = normalizeBranding(siteSpec)
  const staff = normalizeStaff(siteSpec)
  const services = normalizeServices(siteSpec)
  const bookingHref = siteSpec.bookingUrl ?? "/book"

  elements.container = {
    type: "Container",
    props: {
      theme: buildThemeVars(siteSpec),
    },
    children,
  }

  pushElement(elements, children, "site-nav", "SiteNav", {
    shopName: siteSpec.shop.name,
    logoUrl: branding.logo_url,
    links: [
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Services", href: "#services" },
      { label: "Reviews", href: "#testimonials" },
      { label: "Location", href: "#location" },
      { label: "Book", href: bookingHref },
    ],
  })

  if (siteSpec.landingMode === "split_door" && siteSpec.splitDoor) {
    pushElement(elements, children, "split-door-hero", "SplitDoorHero", {
      address: siteSpec.splitDoor.address ?? siteSpec.shop.address,
      eyebrow: siteSpec.splitDoor.eyebrow,
      left: siteSpec.splitDoor.left,
      logoUrl: siteSpec.splitDoor.logoUrl ?? branding.logo_url,
      phone: siteSpec.splitDoor.phone ?? siteSpec.shop.phone,
      prompt: siteSpec.splitDoor.prompt,
      right: siteSpec.splitDoor.right,
      tagline: siteSpec.splitDoor.tagline ?? branding.sub_tagline,
    })
  } else if (hasText(branding.tagline) || hasText(branding.description) || hasText(branding.sub_tagline)) {
    pushElement(elements, children, "hero", "Hero", {
      eyebrow: siteSpec.shop.name,
      headline: branding.tagline || siteSpec.shop.name,
      kicker: branding.sub_tagline,
      subtitle: branding.description,
      coverImageUrl: branding.hero_image_url,
      ctaLabel: "Book an Appointment",
      ctaHref: bookingHref,
    })
  }

  if (hasText(siteSpec.shop.brandPhilosophy)) {
    pushElement(elements, children, "brand-philosophy", "TextFeature", {
      id: "about",
      eyebrow: "Brand Philosophy",
      body: siteSpec.shop.brandPhilosophy,
      align: "center",
    })
  }

  if (staff.length > 0) {
    pushElement(elements, children, "staff-grid", "StaffGrid", {
      eyebrow: "Meet the Team",
      intro: "Skilled artists, thoughtful service, and a point of view that shapes the whole experience.",
      staff: staff.map((member) => ({
        name: member.name,
        role: member.role ?? "",
        photoUrl: member.photoUrl,
        bio: member.bio,
        specialties: member.specialties,
        colorHex: member.colorHex,
        services: member.services,
      })),
    })
  }

  if (siteSpec.featuredService) {
    pushElement(elements, children, "featured-service", "FeaturedService", {
      eyebrow: "Featured Service",
      headline: siteSpec.featuredService.headline,
      body: siteSpec.featuredService.description,
      href: bookingHref,
      label: "Learn More",
    })
  }

  if ((siteSpec.portfolioImages?.length ?? 0) > 0) {
    pushElement(elements, children, "portfolio-gallery", "PortfolioGallery", {
      eyebrow: "Portfolio",
      images: siteSpec.portfolioImages?.slice(0, 8).map((src, index) => ({
        src,
        alt: `${siteSpec.shop.name} portfolio image ${index + 1}`,
      })) ?? [],
    })
  }

  const serviceCategories = groupServicesByCategory(services)
  if (serviceCategories.length > 0) {
    pushElement(elements, children, "service-summary", "ServiceSummary", {
      categories: serviceCategories.map((category) => category.name),
      href: bookingHref,
    })
  }

  if ((siteSpec.testimonials?.length ?? 0) > 0) {
    pushElement(elements, children, "testimonials", "Testimonials", {
      testimonials: siteSpec.testimonials?.slice(0, 4) ?? [],
    })
  }

  if (hasText(siteSpec.shop.originStory)) {
    pushElement(elements, children, "origin-story", "StorySection", {
      eyebrow: "Our Story",
      paragraphs: splitParagraphs(siteSpec.shop.originStory),
    })
  }

  const aggregatedHours = aggregateHours(siteSpec.hours)
  if (aggregatedHours.length > 0 || hasContactInfo(siteSpec)) {
    pushElement(elements, children, "location", "LocationSection", {
      hours: aggregatedHours,
      address: siteSpec.shop.address ?? undefined,
      phone: siteSpec.shop.phone ?? undefined,
      email: siteSpec.shop.email ?? undefined,
      mapsUrl: getMapsUrl(siteSpec),
      mapCoordinates: siteSpec.shop.mapCoordinates ?? undefined,
      social: siteSpec.social ?? [],
    })
  }

  const infoItems = buildInfoItems(siteSpec, branding)
  if (infoItems.length > 0) {
    pushElement(elements, children, "info-grid", "InfoGrid", {
      eyebrow: "Policies & Info",
      items: infoItems,
    })
  }

  if ((siteSpec.shop.paymentMethods?.length ?? 0) > 0) {
    pushElement(elements, children, "payment-methods", "BadgeRow", {
      eyebrow: "Payment Methods",
      badges: siteSpec.shop.paymentMethods,
    })
  }

  pushElement(elements, children, "booking-cta", "BookingCTA", {
    label: "Book an Appointment",
    href: bookingHref,
    variant: "sticky",
  })

  pushElement(elements, children, "site-footer", "SiteFooter", {
    text: "Powered by",
    linkText: "Koureia",
    linkHref: "https://koureia.com",
  })

  const spec: SpecShape = {
    root: "container",
    elements,
  }

  return spec as Spec
}

function pushElement(
  elements: Record<string, ElementSpec>,
  children: string[],
  id: string,
  type: string,
  props: Record<string, unknown>,
) {
  elements[id] = { type, props }
  children.push(id)
}

function normalizeBranding(siteSpec: SiteSpec): BrandingJSON {
  const legacy = siteSpec.shop.branding_json ?? {}
  return {
    ...legacy,
    logo_url: legacy.logo_url ?? siteSpec.branding?.logoUrl,
    hero_image_url: legacy.hero_image_url ?? siteSpec.branding?.heroImageUrl,
    tagline: legacy.tagline ?? siteSpec.shop.tagline,
    sub_tagline: legacy.sub_tagline ?? siteSpec.shop.subTagline,
    description: legacy.description ?? siteSpec.shop.description,
    cancellation_policy: legacy.cancellation_policy ?? siteSpec.shop.cancellationPolicy,
  }
}

function buildThemeVars(siteSpec: SiteSpec) {
  const branding = siteSpec.branding
  const background = branding?.backgroundColor
  const text = branding?.textColor
  const accent = branding?.accentColor ?? branding?.primaryColor
  const accentStrong = branding?.primaryColor ?? branding?.accentColor
  const secondary = branding?.secondaryColor
  const bodyFont = branding?.bodyFont

  return stripEmpty({
    "--shell-bg": background,
    "--shell-bg-elevated": colorWithAlpha(text, 0.04) ?? secondary,
    "--shell-bg-soft": colorWithAlpha(text, 0.03) ?? secondary,
    "--shell-border": colorWithAlpha(text, 0.14),
    "--shell-text": text,
    "--shell-text-muted": colorWithAlpha(text, 0.72),
    "--shell-text-subtle": colorWithAlpha(text, 0.54),
    "--shell-accent": accent,
    "--shell-accent-strong": accentStrong,
    "--shell-accent-contrast": contrastText(accent),
    backgroundColor: background,
    color: text,
    fontFamily: bodyFont,
  })
}

function stripEmpty(values: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0),
  )
}

function colorWithAlpha(value: string | undefined, alpha: number) {
  const rgb = parseHexColor(value)
  if (!rgb) return undefined
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

function contrastText(value: string | undefined) {
  const rgb = parseHexColor(value)
  if (!rgb) return undefined
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.58 ? "#1a1410" : "#ffffff"
}

function parseHexColor(value: string | undefined) {
  if (!value) return null
  const normalized = value.trim().replace(/^#/, "")
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null
  const number = Number.parseInt(normalized, 16)
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  }
}

function normalizeStaff(siteSpec: SiteSpec) {
  return siteSpec.staff.map((member) => ({
    name: member.name,
    role: member.role,
    photoUrl: member.photo_url ?? member.imageUrl ?? null,
    bio: member.bio,
    specialties: member.specialties ?? [],
    colorHex: member.colorHex ?? null,
    services: member.services.map((service) => typeof service === "string" ? service : service.name),
  }))
}

function normalizeServices(siteSpec: SiteSpec) {
  if (siteSpec.services && siteSpec.services.length > 0) {
    return siteSpec.services
  }

  const services = new Map<string, NormalizedService>()
  for (const member of siteSpec.staff) {
    for (const service of member.services) {
      if (typeof service === "string") continue
      services.set(service.name, service)
    }
  }
  return [...services.values()]
}

function groupServicesByCategory(services: NormalizedService[]) {
  const byCategory = new Map<string, Array<Record<string, string | null>>>()

  for (const service of services) {
    const category = service.category?.trim() || "Services"
    const items = byCategory.get(category) ?? []

    items.push({
      name: service.name,
      description: service.description ?? null,
      duration: formatDuration(service.duration_minutes ?? service.durationMinutes ?? 0),
      price: formatPrice(service.price_cents ?? service.priceCents ?? 0),
    })

    byCategory.set(category, items)
  }

  return Array.from(byCategory.entries()).map(([category, items]) => ({
    name: category,
    services: items,
  }))
}

function aggregateHours(hours: SiteSpec["hours"]) {
  const byDay = new Map<number, Array<{ staffName: string; startTime: string; endTime: string }>>()

  for (const entry of hours) {
    const dayOfWeek = entry.day_of_week ?? entry.dayOfWeek
    const startTime = entry.start_time ?? entry.startTime
    const endTime = entry.end_time ?? entry.endTime
    if (dayOfWeek === undefined || !startTime || !endTime) continue

    const items = byDay.get(dayOfWeek) ?? []
    items.push({
      staffName: entry.staff_name ?? entry.staffName ?? "",
      startTime,
      endTime,
    })
    byDay.set(dayOfWeek, items)
  }

  return DAY_ORDER.filter((day) => byDay.has(day)).map((dayOfWeek) => {
    const entries = (byDay.get(dayOfWeek) ?? []).sort(compareHours)
    const earliest = entries[0]?.startTime
    const latest = entries.reduce<string | null>((value, entry) => {
      if (value === null || entry.endTime > value) return entry.endTime
      return value
    }, null)
    const closed = !earliest || !latest || (earliest === "00:00" && latest === "00:00")

    return {
      day: formatDayOfWeek(dayOfWeek),
      open: earliest ? formatTimeLabel(earliest) : undefined,
      close: latest ? formatTimeLabel(latest) : undefined,
      closed,
    }
  })
}

function compareHours(
  a: { staffName: string; startTime: string; endTime: string },
  b: { staffName: string; startTime: string; endTime: string },
) {
  if (a.startTime !== b.startTime) {
    return a.startTime.localeCompare(b.startTime)
  }

  if (a.endTime !== b.endTime) {
    return a.endTime.localeCompare(b.endTime)
  }

  return a.staffName.localeCompare(b.staffName)
}

function formatPrice(priceCents: number) {
  const dollars = priceCents / 100
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    maximumFractionDigits: 2,
  })

  return formatter.format(dollars)
}

function formatDuration(durationMinutes: number) {
  return `${durationMinutes}min`
}

function formatDayOfWeek(dayOfWeek: number) {
  return DAY_LABELS[dayOfWeek] ?? `Day ${dayOfWeek}`
}

function formatTimeLabel(value: string) {
  const [hourPart, minutePart = "00"] = value.split(":")
  const hour = Number(hourPart)
  const minute = Number(minutePart)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return value

  const suffix = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function splitParagraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function hasContactInfo(siteSpec: SiteSpec) {
  return Boolean(siteSpec.shop.address || siteSpec.shop.phone || siteSpec.shop.email || (siteSpec.social?.length ?? 0) > 0)
}

function getMapsUrl(siteSpec: SiteSpec) {
  if (siteSpec.shop.mapCoordinates) {
    const { lat, lng } = siteSpec.shop.mapCoordinates
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }

  if (siteSpec.shop.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteSpec.shop.address)}`
  }

  return undefined
}

function buildInfoItems(siteSpec: SiteSpec, branding: BrandingJSON) {
  const items: Array<InfoGridItem | null> = [
    hasText(branding.cancellation_policy)
      ? { label: "Cancellation policy", body: branding.cancellation_policy }
      : null,
    hasText(siteSpec.shop.birthdayPromo)
      ? { label: "Birthday promotion", body: siteSpec.shop.birthdayPromo }
      : null,
    hasText(siteSpec.shop.giftCardUrl)
      ? { label: "Gift cards", href: siteSpec.shop.giftCardUrl, linkText: "Purchase a Gift Card" }
      : null,
    hasText(siteSpec.shop.googleReviewsUrl)
      ? { label: "Google reviews", href: siteSpec.shop.googleReviewsUrl, linkText: "Leave us a Review" }
      : null,
  ]

  return items.filter((item): item is InfoGridItem => item !== null)
}

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
