import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { resolveSiteSpec, resolveTenant } from "@/lib/tenant"
import {
  fetchBookingContext,
  mockAfterHoursStaffIds,
} from "@/lib/booking-context"
import {
  findStaffByIdOrName,
  filterAfterHoursService,
} from "@/lib/booking-filters"
import { RequestRenderer } from "./after-hours/request-renderer"
import { buildRequestSpec } from "./build-request-spec"

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
      description: formatBookingRequestDescription(variant, null),
    }
  }

  return {
    title: `${formatBookingRequestTitle(variant)} | ${tenant.name}`,
    description: formatBookingRequestDescription(variant, tenant.name),
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

  const selectedStaff = findStaffByIdOrName(bookingContext.staff, effectiveStaffId)

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

  const services = filterAfterHoursService(baseServices)

  // Filter staff to after-hours eligible members when policy exists
  const staff = variant === "after-hours" && afterHours
    ? bookingContext.staff.filter((m) => afterHours.staff_ids.includes(m.id))
    : bookingContext.staff

  const spec = buildRequestSpec({
    shopName: siteSpec.shop.name,
    shopLogoUrl: siteSpec.branding?.logoUrl,
    source,
    variant,
    services,
    staff,
    preselectedServiceId: selectedService?.id,
    preselectedStaffId: selectedStaff?.id,
    staffName: selectedStaff?.name?.split(" ")[0],
    afterHours: variant === "after-hours" && afterHours ? afterHours : undefined,
    shopTimezone: bookingContext.shop.timezone,
    apiUrl,
    shopSlug: tenant.slug,
    siteHours: siteSpec.hours,
    staffHoursById: Object.fromEntries(siteSpec.staff.map((member) => [member.id, member.hours])),
    waitlistHorizonDays: siteSpec.waitlist.horizonDays,
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

function formatBookingRequestDescription(variant: BookingRequestVariant, shopName: string | null) {
  if (variant === "after-hours") {
    return shopName
      ? `Book an after-hours appointment at ${shopName}.`
      : "Book an after-hours appointment."
  }
  return shopName
    ? `Join the waitlist at ${shopName}.`
    : "Join the waitlist."
}

function getSingleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0]
}
