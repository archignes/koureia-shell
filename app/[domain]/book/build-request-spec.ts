import type { Spec } from "@json-render/core"
import { formatDuration, formatPrice } from "@/lib/format"
import {
  splitServices,
  type BookingContext,
} from "@/lib/booking-context"
import { staffToFirstNames, extractBookingModes, hasSharedServices } from "@/lib/booking-filters"
import type { BookingRequestVariant } from "./request-page"

export function buildRequestSpec({
  shopName,
  shopLogoUrl,
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
  siteHours,
  staffHoursById,
  waitlistHorizonDays,
}: {
  shopName: string
  shopLogoUrl?: string
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
    booking_mode: "individual" | "package"
    package_name: string | null
    package_price_cents: number | null
    package_price_display: string | null
    package_addons: Array<{ name: string; gratis: boolean }>
    logo_url: string | null
  }
  shopTimezone?: string
  apiUrl?: string
  shopSlug?: string
  siteHours?: Array<{ dayOfWeek: number; startTime: string; endTime: string; isClosed: boolean }>
  staffHoursById?: Record<string, Array<{ dayOfWeek: number; startTime: string; endTime: string; isClosed: boolean }>>
  waitlistHorizonDays?: number
}): Spec {
  const fmt = (s: BookingContext["services"][number]) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? undefined,
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
  const isPackageMode = isAfterHours && afterHours.booking_mode === "package"
  const hideStaffPicker = isAfterHours && preselectedStaffId

  // Extract booking-mode services (After Hours, Home Service) from regular list
  const { regular: regularServices, modes: bookingModes } = extractBookingModes(services)
  const { primary, extras } = splitServices(regularServices)

  const hasBookingModes = variant === "waitlist" && bookingModes.length > 0

  const children = isAfterHours
    ? ["hero", "surcharge-banner", ...(hideStaffPicker ? [] : ["staff-pick"]),
       "service-menu", "availability-pick", "contact-fields", "order-summary",
       "policy-confirm", "submit"]
    : variant === "waitlist"
      ? ["hero", "staff-pick", "service-menu",
         ...(hasBookingModes ? ["booking-modes"] : []),
         "availability-pick", "prefs", "submit"]
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
            : variant === "waitlist"
              ? "Join the Waitlist"
              : "Request an appointment",
        subtitle:
          variant === "waitlist"
            ? "Tell us what you're looking for and when works for you. We'll reach out when a slot opens."
            : isPackageMode
              ? "Choose a few evening options and we’ll confirm one by text."
            : staffName
              ? `Choose a service and preferred time. ${staffName} will confirm by text.`
              : "Pick your preferences and we'll confirm your time.",
        shopName,
        shopLogoUrl,
        staffName: variant === "waitlist" ? undefined : staffName,
        logoUrl: isAfterHours ? afterHours.logo_url : undefined,
      },
    },
    "staff-pick": {
      type: "StaffPicker",
      props: {
        staff: staffToFirstNames(staff),
        allowNoPreference: variant === "waitlist" && hasSharedServices(services),
        preselectedId: variant === "waitlist" ? undefined : preselectedStaffId,
      },
    },
    "service-pick": {
      type: "ServicePicker",
      props: {
        services: allFormattedServices,
        preselectedId: preselectedServiceId,
      },
    },
    ...(variant === "waitlist" ? {
      "service-menu": {
        type: "ServiceMenu",
        props: {
          primary: primary.map(fmt),
          extras: extras.map(fmt),
          preselectedId: preselectedServiceId,
          sectionLabel: "Services",
        },
      },
      ...(hasBookingModes ? {
        "booking-modes": {
          type: "BookingModeButtons",
          props: {
            modes: bookingModes.map((m) => ({
              mode: m.mode,
              label: m.label,
              description: m.description,
              price: m.price,
              serviceId: m.serviceId,
            })),
          },
        },
      } : {}),
    } : {}),
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
          notesPlaceholder: "Special requests or notes",
        },
      },
      "order-summary": {
        type: "OrderSummary",
        props: {
          allServices: [...primary, ...extras].map(fmt),
          surchargeCents: afterHours.surcharge_cents,
        },
      },
      "policy-confirm": {
        type: "PolicyConfirm",
        props: {
          message: `I acknowledge the ${afterHours.surcharge_display.toLowerCase()} and agree to receive booking-related texts.`,
        },
      },
    } : {}),
    ...(!isAfterHours ? {
      ...(variant === "waitlist"
        ? {
            "availability-pick": {
              type: "WaitlistAvailabilityPicker",
              props: {
                shopHours: siteHours ?? [],
                staffHoursById: staffHoursById ?? {},
                horizonDays: waitlistHorizonDays ?? 7,
                timezone: shopTimezone,
              },
            },
          }
        : {}),
      prefs: {
        type: "PreferenceForm",
        props: variant === "waitlist" ? {
          fields: ["notes", "name", "email", "phone"],
          notesLabel: "What are you looking for?",
          notesPlaceholder: "e.g., Color correction, balayage touch-up, first-time consultation...",
        } : {
          fields: ["name", "phone", "dateRange", "timeWindow", "notes"],
          notesPlaceholder: "Anything we should know? First time, specific requests, etc.",
        },
      },
    } : {}),
    submit: {
      type: "SubmitButton",
      props: {
        label: isAfterHours
          ? "Confirm Booking"
          : variant === "waitlist"
            ? "Join Waitlist"
            : "Send Request",
        submittingLabel: isAfterHours
          ? "Booking..."
          : variant === "waitlist"
            ? "Joining Waitlist..."
            : "Sending...",
        submittingHint: variant === "waitlist" ? "Saving your spot..." : undefined,
      },
      on: { submit: { action: "submit" } },
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
      ...(variant === "waitlist" ? { availabilityBlocks: [] } : {}),
      ...(isAfterHours
        ? {
            surchargeCents: afterHours.surcharge_cents,
            afterHoursBookingMode: afterHours.booking_mode,
            packageBaseServiceId: preselectedServiceId,
            afterHoursPackage: isPackageMode
              ? {
                  name: afterHours.package_name ?? "After-Hours Package",
                  priceCents: afterHours.package_price_cents ?? 0,
                  priceDisplay: afterHours.package_price_display ?? "$0",
                  logoUrl: afterHours.logo_url,
                  addons: afterHours.package_addons,
                }
              : null,
          }
        : {}),
    },
  }
}
