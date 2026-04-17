import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import type { Spec } from "@json-render/core"
import { resolveSiteSpec, resolveTenant } from "@/lib/tenant"
import {
  fetchBookingContext,
  mockAfterHoursStaffIds,
  type BookingContext,
} from "@/lib/booking-context"
import { RequestRenderer } from "./after-hours/request-renderer"

export type BookingRequestVariant = "after-hours" | "waitlist"

type SharedPageProps = {
  params: Promise<{ domain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
  variant: BookingRequestVariant
}

export type BookingRequestPageProps = Omit<SharedPageProps, "variant">

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function generateBookingRequestMetadata({
  params,
  variant,
}: {
  params: BookingRequestPageProps["params"]
  variant: BookingRequestVariant
}): Promise<Metadata> {
  const { domain } = await params
  const tenant = await resolveTenant(domain)

  if (!tenant) {
    return {
      title: formatBookingRequestTitle(variant),
    }
  }

  return {
    title: `${formatBookingRequestTitle(variant)} | ${tenant.name}`,
  }
}

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
  const isLocalDev = normalizedHost === "localhost" || normalizedHost === "127.0.0.1"
  const tenantDomain = isLocalDev
    ? (domain.includes(".") ? domain : `${domain}.koureia.com`)
    : (normalizedHost || domain)

  const tenant = await resolveTenant(tenantDomain)

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

  // Use real after_hours policy from API, or mock for dev until API is ready
  const afterHours = bookingContext.after_hours ?? (variant === "after-hours" ? {
    enabled: true,
    surcharge_cents: 10000,
    surcharge_display: "+$100 after-hours fee added to the service total",
    min_advance_hours: 24,
    staff_ids: mockAfterHoursStaffIds(bookingContext.staff),
  } : null)

  // Auto-select staff from after-hours policy if single staff member
  const effectiveStaffId =
    requestedStaffId ??
    (variant === "after-hours" && afterHours?.staff_ids.length === 1
      ? afterHours.staff_ids[0]
      : undefined)

  const selectedStaff = effectiveStaffId
    ? bookingContext.staff.find((member) => member.id === effectiveStaffId)
    : undefined

  const selectedService =
    requestedServiceId
      ? bookingContext.services.find((service) => service.id === requestedServiceId)
      : undefined

  const waitlistId =
    requestedSource === "sms-refinement" && requestedEntry && UUID_RE.test(requestedEntry)
      ? requestedEntry
      : undefined

  const source = requestedSource === "sms-refinement" ? "sms-refinement" : variant

  // Filter services: pre-selected takes priority, then staff-based filtering for after-hours
  const baseServices = selectedService
    ? [selectedService]
    : selectedStaff
      ? bookingContext.services.filter((s) => s.staff_ids.includes(selectedStaff.id))
      : bookingContext.services

  // Hide the catch-all "AFTER HOURS" service on the after-hours page
  const services = variant === "after-hours"
    ? baseServices.filter((s) => !s.name.toUpperCase().includes("AFTER HOURS"))
    : baseServices

  // Filter staff to after-hours eligible members when policy exists
  const staff = variant === "after-hours" && afterHours
    ? bookingContext.staff.filter((m) => afterHours.staff_ids.includes(m.id))
    : bookingContext.staff

  const spec = buildRequestSpec({
    shopName: siteSpec.shop.name,
    source,
    variant,
    services,
    staff,
    preselectedServiceId: selectedService?.id,
    preselectedStaffId: selectedStaff?.id,
    staffName: selectedStaff?.name?.split(" ")[0],
  })

  return (
    <RequestRenderer
      apiUrl={apiUrl}
      shopSlug={bookingContext.shop.slug}
      shopId={bookingContext.shop.id}
      spec={spec}
      variant={variant}
      waitlistId={waitlistId}
    />
  )
}

function formatBookingRequestTitle(variant: BookingRequestVariant) {
  return variant === "after-hours" ? "After-Hours Booking" : "Join Waitlist"
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
            : "Join the Waitlist",
        subtitle:
          variant === "waitlist"
            ? "Tell us what you're looking for and when works for you. We'll reach out when a slot opens."
            : staffName
              ? `Pick a time that works and ${staffName} will confirm.`
              : "Pick your preferences and we'll confirm your time.",
        shopName,
        staffName: variant === "after-hours" ? staffName : undefined,
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
        allowNoPreference: variant === "waitlist",
        preselectedId: variant === "after-hours" ? preselectedStaffId : undefined,
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
        fields:
          variant === "waitlist"
            ? ["flexibleDates", "notes", "name", "email", "phone"]
            : ["name", "phone", "dateRange", "timeWindow", "notes"],
        dateRangeLabel:
          variant === "waitlist" ? "When works for you?" : undefined,
        dateRangePlaceholder:
          variant === "waitlist"
            ? "e.g., Weekday evenings, any Saturday, flexible on timing..."
            : undefined,
        notesLabel:
          variant === "waitlist" ? "What are you looking for?" : undefined,
        notesPlaceholder:
          variant === "waitlist"
            ? "e.g., Color correction, balayage touch-up, first-time consultation..."
            : "Anything we should know? First time, specific requests, etc.",
      },
    },
    submit: {
      type: "SubmitButton",
      props: {
        label: variant === "waitlist" ? "Join Waitlist" : "Send Request",
        submittingLabel: "Sending...",
      },
    },
  }

  return {
    root: "container",
    elements,
    state: {
      selectedStaffId: variant === "after-hours" ? preselectedStaffId : undefined,
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
