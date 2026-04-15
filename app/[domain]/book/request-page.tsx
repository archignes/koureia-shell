import { headers } from "next/headers"
import { notFound } from "next/navigation"
import type { Spec } from "@json-render/core"
import { resolveSiteSpec, resolveTenant } from "@/lib/tenant"
import { formatDuration, formatPrice } from "@/lib/format"
import {
  fetchBookingContext,
  splitServices,
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

  const source =
    requestedSource === "sms-refinement" ? "sms-refinement" : variant

  // Pre-filter services by staff when staff is pre-selected
  // Hide the catch-all "AFTER HOURS" service on the after-hours page
  const baseServices = selectedService
    ? [selectedService]
    : selectedStaff
      ? bookingContext.services.filter(
          (s) => s.staff_ids.includes(selectedStaff.id)
        )
      : bookingContext.services

  const services = variant === "after-hours"
    ? baseServices.filter((s) => !s.name.toUpperCase().includes("AFTER HOURS"))
    : baseServices

  const spec = buildRequestSpec({
    shopName: siteSpec.shop.name,
    source,
    variant,
    services,
    staff: bookingContext.staff,
    preselectedServiceId: selectedService?.id,
    preselectedStaffId: selectedStaff?.id,
    staffName: selectedStaff?.name.split(" ")[0],
    afterHours: variant === "after-hours" && afterHours ? afterHours : undefined,
    shopTimezone: bookingContext.shop.timezone,
    apiUrl,
    shopSlug: tenant.slug,
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

function buildRequestSpec({
  shopName,
  source,
  variant,
  services,
  staff,
  preselectedServiceId,
  preselectedStaffId,
  staffName,
  afterHours,
  shopTimezone,
  apiUrl,
  shopSlug,
}: {
  shopName: string
  source: "after-hours" | "waitlist" | "sms-refinement"
  variant: BookingRequestVariant
  services: BookingContext["services"]
  staff: BookingContext["staff"]
  preselectedServiceId?: string
  preselectedStaffId?: string
  staffName?: string
  afterHours?: {
    surcharge_cents: number
    surcharge_display: string
    min_advance_hours: number
  }
  shopTimezone?: string
  apiUrl?: string
  shopSlug?: string
}): Spec {
  const fmt = (s: BookingContext["services"][number]) => ({
    id: s.id,
    name: s.name,
    duration: formatDuration(s.duration_minutes),
    price: formatPrice(s.price_cents, s.price_display),
    priceCents: s.price_cents,
  })

  const allFormattedServices = services.map(fmt)
  const serviceStaffMap: Record<string, string[]> = {}
  for (const service of services) {
    serviceStaffMap[service.id] = service.staff_ids
  }

  const isAfterHours = variant === "after-hours" && afterHours
  const hideStaffPicker = isAfterHours && preselectedStaffId
  const { primary, extras } = splitServices(services)

  const children = isAfterHours
    ? ["hero", "surcharge-banner", ...(hideStaffPicker ? [] : ["staff-pick"]),
       "service-menu", "availability-pick", "contact-fields", "order-summary", "submit"]
    : ["hero", ...(hideStaffPicker ? [] : ["staff-pick"]),
       "service-pick", "prefs", "submit"]

  const elements: Spec["elements"] = {
    container: {
      type: "Container",
      props: {},
      children,
    },
    hero: {
      type: "RequestHero",
      props: {
        headline:
          variant === "after-hours"
            ? "After-Hours Booking Request"
            : "Request an appointment",
        subtitle: staffName
          ? `Choose a service and preferred time. ${staffName} will confirm by text.`
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
        services: allFormattedServices,
        preselectedId: preselectedServiceId,
      },
    },
    ...(isAfterHours ? {
      "service-menu": {
        type: "ServiceMenu",
        props: {
          primary: primary.map(fmt),
          extras: extras.map(fmt),
          preselectedId: preselectedServiceId,
          sectionLabel: "Barber cuts",
        },
      },
    } : {}),
    ...(isAfterHours
      ? {
          "surcharge-banner": {
            type: "SurchargeBanner",
            props: {
              message: afterHours.surcharge_display,
            },
          },
          "availability-pick": {
            type: "AvailabilityPicker",
            props: {
              apiUrl,
              shopSlug,
              staffId: preselectedStaffId,
              minAdvanceHours: afterHours.min_advance_hours,
              surchargeCents: afterHours.surcharge_cents,
              shopTimezone,
            },
          },
          "contact-fields": {
            type: "PreferenceForm",
            props: {
              fields: ["name", "phone", "notes"],
              notesPlaceholder:
                "Special requests or notes",
            },
          },
          "order-summary": {
            type: "OrderSummary",
            props: {
              allServices: [...primary, ...extras].map(fmt),
              surchargeCents: afterHours.surcharge_cents,
            },
          },
        }
      : {
          prefs: {
            type: "PreferenceForm",
            props: {
              fields: ["name", "phone", "dateRange", "timeWindow", "notes"],
              notesPlaceholder:
                "Special requests or notes",
            },
          },
        }),
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
      serviceStaffMap,
      allFormattedServices,
      ...(isAfterHours
        ? { surchargeCents: afterHours.surcharge_cents }
        : {}),
    },
  }
}

function getSingleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0]
}

