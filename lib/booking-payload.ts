import type { BookingRequestVariant } from "@/app/[domain]/book/request-page"

type RequestSource = "after-hours" | "waitlist" | "sms-refinement"
type TimeWindow = "morning" | "afternoon" | "evening" | "anytime"
type AvailabilityBlock = {
  date: string
  start_time: string
  end_time: string
}

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
  preferredSlots?: Array<{ starts_at: string; ends_at: string }>
  surchargeCents?: number
  notes?: string
  source?: RequestSource
  waitlistLinkToken?: string
  serviceStaffMap?: Record<string, string[]>
  allFormattedServices?: FormattedService[]
  policyAccepted?: boolean
  availabilityBlocks?: AvailabilityBlock[]
  packageBaseServiceId?: string
  afterHoursBookingMode?: "individual" | "package"
  afterHoursPackage?: {
    name: string
    description?: string | null
    priceCents: number
    priceDisplay: string
    logoUrl?: string | null
    addons: Array<{ name: string; gratis: boolean }>
  } | null
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
        availability_blocks: state.availabilityBlocks,
        notes: toNonEmptyString(state.notes),
        source: isRequestSource(state.source) ? state.source : "public",
        waitlistId,
        waitlistLinkToken: toNonEmptyString(state.waitlistLinkToken),
      },
    }
  }

  return {
    path: "/api/booking/request",
    body: {
      shopId,
      serviceId:
        state.afterHoursBookingMode === "package"
          ? toNonEmptyString(state.packageBaseServiceId) ?? toNonEmptyString(state.selectedServiceId)
          : toNonEmptyString(state.selectedServiceId),
      staffId: toNonEmptyString(state.selectedStaffId),
      clientName: toNonEmptyString(state.name),
      clientPhone: normalizePhoneForApi(state.phone),
      preferredDate:
        state.afterHoursBookingMode === "package"
          ? state.preferredSlots?.[0]?.starts_at.slice(0, 10) ?? toNonEmptyString(state.preferredDate)
          : toNonEmptyString(state.preferredDate) ?? toNonEmptyString(state.dateRange),
      preferredSlotStart: toNonEmptyString(state.preferredSlotStart),
      preferredSlotEnd: toNonEmptyString(state.preferredSlotEnd),
      timeWindow: isTimeWindow(state.timeWindow) ? state.timeWindow : undefined,
      notes: buildRequestNotes(state),
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

function buildRequestNotes(state: RequestState) {
  const parts: string[] = []
  if (toNonEmptyString(state.notes)) {
    parts.push(state.notes!.trim())
  }
  if (state.afterHoursBookingMode === "package" && state.preferredSlots?.length) {
    parts.push(`Preferred slots: ${state.preferredSlots.map((slot) => slot.starts_at).join(", ")}`)
  }
  return parts.length > 0 ? parts.join("\n\n") : undefined
}
