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
