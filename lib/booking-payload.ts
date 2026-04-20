import type { BookingRequestVariant } from "@/app/[domain]/book/request-page"

type RequestSource = "after-hours" | "waitlist" | "sms-refinement"
type TimeWindow = "morning" | "afternoon" | "evening" | "anytime"

type FormattedService = {
  id: string
  name: string
  duration: string
  price: string
}

export type RequestState = {
  selectedServiceId?: string
  selectedStaffId?: string
  name?: string
  email?: string
  phone?: string
  dateRange?: string
  flexibleDates?: string
  timeWindow?: TimeWindow
  preferredDate?: string
  preferredSlotStart?: string
  preferredSlotEnd?: string
  /** Full UTC ISO startsAt for hold creation (bypasses date+time construction) */
  preferredStartsAt?: string
  surchargeCents?: number
  notes?: string
  source?: RequestSource
  serviceStaffMap?: Record<string, string[]>
  allFormattedServices?: FormattedService[]
  policyAccepted?: boolean
}

export function buildRequestPayload(opts: {
  shopId: string
  shopSlug: string
  state: RequestState
  variant: BookingRequestVariant
  waitlistId?: string
}) {
  const { shopId, shopSlug, state, variant, waitlistId } = opts

  if (variant === "waitlist") {
    return {
      path: "/api/booking/waitlist",
      body: {
        shopSlug,
        clientName: toNonEmptyString(state.name),
        clientEmail: toNonEmptyString(state.email),
        clientPhone: normalizePhoneForApi(state.phone),
        serviceId: toNonEmptyString(state.selectedServiceId),
        staffId: toNullableString(state.selectedStaffId),
        flexibleDates: toNonEmptyString(state.flexibleDates),
        notes: toNonEmptyString(state.notes),
        source: isRequestSource(state.source) ? state.source : "public",
        waitlistId,
      },
    }
  }

  return {
    path: "/api/booking/request",
    body: {
      shopId,
      serviceId: toNonEmptyString(state.selectedServiceId),
      staffId: toNonEmptyString(state.selectedStaffId),
      clientName: toNonEmptyString(state.name),
      clientPhone: normalizePhoneForApi(state.phone),
      preferredDate:
        toNonEmptyString(state.preferredDate) ?? toNonEmptyString(state.dateRange),
      preferredSlotStart: toNonEmptyString(state.preferredSlotStart),
      preferredSlotEnd: toNonEmptyString(state.preferredSlotEnd),
      timeWindow: isTimeWindow(state.timeWindow) ? state.timeWindow : undefined,
      notes: toNonEmptyString(state.notes),
      source: isRequestSource(state.source) ? state.source : "waitlist",
      waitlistId,
    },
  }
}

function toNonEmptyString(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function toNullableString(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function normalizePhoneForApi(value: string | undefined) {
  const trimmed = toNonEmptyString(value)
  if (!trimmed) return undefined
  if (/^\+[1-9]\d{1,14}$/.test(trimmed)) return trimmed
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  return trimmed
}

function isRequestSource(value: string | undefined): value is RequestSource {
  return value === "after-hours" || value === "waitlist" || value === "sms-refinement"
}

function isTimeWindow(value: string | undefined): value is TimeWindow {
  return (
    value === "morning" ||
    value === "afternoon" ||
    value === "evening" ||
    value === "anytime"
  )
}
