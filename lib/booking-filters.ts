import type { BookingContext } from "./booking-context"

type Staff = BookingContext["staff"][number]
type Service = BookingContext["services"][number]

/** Match a staff member by UUID or by case-insensitive first-name match */
export function findStaffByIdOrName(
  staff: Staff[],
  query: string | undefined
): Staff | undefined {
  if (!query) return undefined
  return staff.find(
    (m) =>
      m.id === query ||
      m.name.split(" ")[0].toLowerCase() === query.toLowerCase()
  )
}

/** Map staff to first-name-only display objects for the spec */
export function staffToFirstNames(staff: Staff[]) {
  return staff.map((m) => ({
    id: m.id,
    name: m.name.split(" ")[0],
    role: m.role,
  }))
}

/** Filter out the catch-all "AFTER HOURS" booking-type marker from services */
export function filterAfterHoursService(services: Service[]): Service[] {
  return services.filter((s) => !s.name.toUpperCase().includes("AFTER HOURS"))
}

/** True if any service is offered by more than one staff member */
export function hasSharedServices(services: Service[]): boolean {
  return services.some((s) => s.staff_ids.length > 1)
}

/** Well-known booking mode service names (case-insensitive match) */
const BOOKING_MODE_PATTERNS = [
  { pattern: "AFTER HOURS", mode: "after-hours" as const, label: "After-Hours Booking", description: "Book an evening or weekend appointment" },
  { pattern: "LOCAL AT HOME SERVICE", mode: "home-service" as const, label: "Local Home Service", description: "We come to you" },
]

export type BookingMode = {
  mode: "after-hours" | "home-service"
  label: string
  description: string
  serviceId: string
  price: string
}

/** Extract booking-mode services and return them separately from regular services */
export function extractBookingModes(services: Service[]): {
  regular: Service[]
  modes: BookingMode[]
} {
  const regular: Service[] = []
  const modes: BookingMode[] = []

  for (const s of services) {
    const upper = s.name.toUpperCase()
    const matched = BOOKING_MODE_PATTERNS.find((p) => upper.includes(p.pattern))
    if (matched) {
      modes.push({
        mode: matched.mode,
        label: matched.label,
        description: matched.description,
        serviceId: s.id,
        price: s.price_display ?? `$${(s.price_cents / 100).toFixed(0)}+`,
      })
    } else {
      regular.push(s)
    }
  }

  return { regular, modes }
}
