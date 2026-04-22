import type { Spec } from "@json-render/core"
import { formatDuration, formatPrice } from "@/lib/format"
import {
  splitServices,
  type BookingContext,
} from "@/lib/booking-context"
import { staffToFirstNames } from "@/lib/booking-filters"
import type { BookingRequestVariant } from "./request-page"

export function buildRequestSpec({
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
  const hideStaffPicker = isAfterHours && preselectedStaffId
  const { primary, extras } = splitServices(services)

  const children = isAfterHours
    ? ["hero", "surcharge-banner", ...(hideStaffPicker ? [] : ["staff-pick"]),
       "service-menu", "availability-pick", "contact-fields", "order-summary",
       "policy-confirm", "submit"]
    : variant === "waitlist"
      ? ["hero", "staff-pick", "service-pick", "prefs", "submit"]
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
            : staffName
              ? `Choose a service and preferred time. ${staffName} will confirm by text.`
              : "Pick your preferences and we'll confirm your time.",
        shopName,
        staffName: variant === "waitlist" ? undefined : staffName,
      },
    },
    "staff-pick": {
      type: "StaffPicker",
      props: {
        staff: staffToFirstNames(staff),
        allowNoPreference: variant === "waitlist",
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
      prefs: {
        type: "PreferenceForm",
        props: variant === "waitlist" ? {
          fields: ["flexibleDates", "notes", "name", "email", "phone"],
          dateRangeLabel: "When works for you?",
          dateRangePlaceholder: "e.g., Weekday evenings, any Saturday, flexible on timing...",
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
        submittingLabel: isAfterHours ? "Booking..." : "Sending...",
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
      ...(isAfterHours
        ? { surchargeCents: afterHours.surcharge_cents }
        : {}),
    },
  }
}
