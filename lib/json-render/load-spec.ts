import type { Spec } from "@json-render/core"

type BrandingJSON = {
  logo_url?: string
  tagline?: string
  description?: string
  cancellation_policy?: string
}

export interface SiteSpec {
  shop: {
    name: string
    slug: string
    branding_json: BrandingJSON | null
    address: string | null
    phone: string | null
    timezone: string
  }
  staff: Array<{
    name: string
    role: string | null
    photo_url: string | null
    bio: string | null
    services: string[]
  }>
  services: Array<{
    name: string
    category: string | null
    duration_minutes: number
    price_cents: number
    description: string | null
  }>
  hours: Array<{
    staff_name: string
    day_of_week: number
    start_time: string
    end_time: string
  }>
}

type ElementSpec = {
  type: string
  props: Record<string, unknown>
  children?: string[]
}

type SpecShape = {
  root: string
  elements: Record<string, ElementSpec>
}

const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6]

export function buildSiteSpec(siteSpec: SiteSpec): Spec {
  const elements: Record<string, ElementSpec> = {}
  const children: string[] = []
  const branding = siteSpec.shop.branding_json ?? {}

  elements.container = {
    type: "Container",
    props: {},
    children,
  }

  pushElement(elements, children, "site-nav", "SiteNav", {
    shopName: siteSpec.shop.name,
    logoUrl: branding.logo_url,
    links: [{ label: "Book", href: "/book" }],
  })

  if (hasText(branding.tagline) || hasText(branding.description)) {
    pushElement(elements, children, "hero", "Hero", {
      headline: branding.tagline,
      subtitle: branding.description,
    })
  }

  if (siteSpec.staff.length > 0) {
    pushElement(elements, children, "staff-grid", "StaffGrid", {
      staff: siteSpec.staff.map((member) => ({
        name: member.name,
        role: member.role ?? "",
        photoUrl: member.photo_url,
        bio: member.bio,
        services: member.services,
      })),
    })
  }

  const serviceCategories = groupServicesByCategory(siteSpec.services)
  if (serviceCategories.length > 0) {
    pushElement(elements, children, "service-accordion", "ServiceAccordion", {
      categories: serviceCategories,
    })
  }

  const aggregatedHours = aggregateHours(siteSpec.hours)
  if (aggregatedHours.length > 0) {
    pushElement(elements, children, "hours-table", "HoursTable", {
      hours: aggregatedHours,
    })
  }

  if (hasText(branding.cancellation_policy)) {
    pushElement(elements, children, "policy-block", "PolicyBlock", {
      title: "Cancellation Policy",
      body: branding.cancellation_policy,
    })
  }

  pushElement(elements, children, "booking-cta", "BookingCTA", {
    label: "Book an Appointment",
    href: "/book",
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

function groupServicesByCategory(services: SiteSpec["services"]) {
  const byCategory = new Map<string, Array<Record<string, string | null>>>()

  for (const service of services) {
    const category = service.category?.trim() || "Services"
    const items = byCategory.get(category) ?? []

    items.push({
      name: service.name,
      description: service.description,
      duration: formatDuration(service.duration_minutes),
      price: formatPrice(service.price_cents),
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
    const items = byDay.get(entry.day_of_week) ?? []
    items.push({
      staffName: entry.staff_name,
      startTime: entry.start_time,
      endTime: entry.end_time,
    })
    byDay.set(entry.day_of_week, items)
  }

  return DAY_ORDER.filter((day) => byDay.has(day)).map((dayOfWeek) => ({
    dayOfWeek,
    entries: (byDay.get(dayOfWeek) ?? []).sort(compareHours),
  }))
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

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}
