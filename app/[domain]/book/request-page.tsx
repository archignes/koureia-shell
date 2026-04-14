import { headers } from "next/headers"
import { notFound } from "next/navigation"
import type { Spec } from "@json-render/core"
import { resolveSiteSpec, resolveTenant } from "@/lib/tenant"
import { RequestRenderer } from "./after-hours/request-renderer"

export type BookingRequestVariant = "after-hours" | "waitlist"

type SharedPageProps = {
  params: Promise<{ domain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
  variant: BookingRequestVariant
}

type BookingContext = {
  shop: {
    id: string
    slug: string
  }
  staff: Array<{
    id: string
    name: string
    role: string
  }>
  services: Array<{
    id: string
    name: string
    duration_minutes: number
    price_cents: number
    price_display: string | null
    staff_ids: string[]
  }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function BookingRequestPage({
  params,
  searchParams,
  variant,
}: SharedPageProps) {
  const [{ domain }, query, headersList] = await Promise.all([
    params,
    searchParams,
    headers(),
  ])

  const host = headersList.get("host") ?? ""
  const normalizedHost = host.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "")

  const tenant = await resolveTenant(normalizedHost || domain)

  if (!tenant) {
    notFound()
  }

  if (tenant.site_status !== "live") {
    notFound()
  }

  const apiUrl = process.env.KOUREIA_API_URL ?? "https://koureia.com"

  const [siteSpec, bookingContext] = await Promise.all([
    resolveSiteSpec(tenant.slug),
    fetchBookingContext(apiUrl, tenant.slug),
  ])

  if (!siteSpec || !bookingContext) {
    notFound()
  }

  const requestedStaffId = getSingleParam(query.staff)
  const requestedServiceId = getSingleParam(query.service)
  const requestedSource = getSingleParam(query.source)
  const requestedEntry = getSingleParam(query.entry)

  const selectedStaff =
    requestedStaffId
      ? bookingContext.staff.find((member) => member.id === requestedStaffId)
      : undefined

  const selectedService =
    requestedServiceId
      ? bookingContext.services.find((service) => service.id === requestedServiceId)
      : undefined

  const waitlistId =
    requestedSource === "sms-refinement" && requestedEntry && UUID_RE.test(requestedEntry)
      ? requestedEntry
      : undefined

  const source =
    requestedSource === "sms-refinement" ? "sms-refinement" : variant

  const services = selectedService
    ? [selectedService]
    : bookingContext.services

  const spec = buildRequestSpec({
    shopName: siteSpec.shop.name,
    source,
    variant,
    services,
    staff: bookingContext.staff,
    preselectedServiceId: selectedService?.id,
    preselectedStaffId: selectedStaff?.id,
    staffName: selectedStaff?.name,
  })

  return (
    <RequestRenderer
      apiUrl={apiUrl}
      shopId={bookingContext.shop.id}
      spec={spec}
      waitlistId={waitlistId}
    />
  )
}

async function fetchBookingContext(apiUrl: string, slug: string): Promise<BookingContext | null> {
  try {
    const response = await fetch(
      `${apiUrl}/api/booking/context?shop=${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 } },
    )

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`API error ${response.status}`)
    }

    return (await response.json()) as BookingContext
  } catch (error) {
    console.error("[koureia-shell] fetchBookingContext failed:", error)
    return null
  }
}

function buildRequestSpec({
  shopName,
  source,
  variant,
  services,
  staff,
  preselectedServiceId,
  preselectedStaffId,
  staffName,
}: {
  shopName: string
  source: "after-hours" | "waitlist" | "sms-refinement"
  variant: BookingRequestVariant
  services: BookingContext["services"]
  staff: BookingContext["staff"]
  preselectedServiceId?: string
  preselectedStaffId?: string
  staffName?: string
}): Spec {
  const elements: Spec["elements"] = {
    container: {
      type: "Container",
      props: {},
      children: ["hero", "staff-pick", "service-pick", "prefs", "submit"],
    },
    hero: {
      type: "RequestHero",
      props: {
        headline:
          variant === "after-hours"
            ? "Request an after-hours appointment"
            : "Request an appointment",
        subtitle: staffName
          ? `Pick a time that works and ${staffName} will confirm.`
          : "Pick your preferences and we'll confirm your time.",
        shopName,
        staffName,
      },
    },
    "staff-pick": {
      type: "StaffPicker",
      props: {
        staff: staff.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role,
        })),
        preselectedId: preselectedStaffId,
      },
    },
    "service-pick": {
      type: "ServicePicker",
      props: {
        services: services.map((service) => ({
          id: service.id,
          name: service.name,
          duration: formatDuration(service.duration_minutes),
          price: formatPrice(service.price_cents, service.price_display),
        })),
        preselectedId: preselectedServiceId,
      },
    },
    prefs: {
      type: "PreferenceForm",
      props: {
        fields: ["name", "phone", "dateRange", "timeWindow", "notes"],
        notesPlaceholder: "Anything we should know? First time, specific requests, etc.",
      },
    },
    submit: {
      type: "SubmitButton",
      props: {
        label: "Send Request",
        submittingLabel: "Sending...",
      },
    },
  }

  return {
    root: "container",
    elements,
    state: {
      selectedStaffId: preselectedStaffId,
      selectedServiceId: preselectedServiceId,
      source,
    },
  }
}

function getSingleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0]
}

function formatDuration(durationMinutes: number) {
  return `${durationMinutes}min`
}

function formatPrice(priceCents: number, priceDisplay: string | null) {
  if (priceDisplay?.trim()) {
    return priceDisplay
  }

  const amount = priceCents / 100

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
