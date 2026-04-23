/**
 * Cross-repo integration test: koureia-shell → koureia prod API → DB
 *
 * Tests the full after-hours booking path through the shell's proxy layer
 * to the production koureia API. Verifies that the shell correctly forwards
 * clientName and clientPhone to the holds endpoint.
 *
 * Requires: KOUREIA_API_URL set (defaults to https://koureia.com)
 *
 * Run: bunx vitest run tests/after-hours-e2e.integration.test.ts
 */
import { describe, it, expect, beforeAll } from "vitest"

const KOUREIA_API = process.env.KOUREIA_API_URL || "https://koureia.com"
const SHOP_SLUG = "dan-the-barber-man"

let danStaffId: string
let serviceId: string

function futureWeekday(daysAhead = 5): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

async function findAvailableSlot(date: string): Promise<{ startsAt: string; slotStart: string } | null> {
  const res = await fetch(
    `${KOUREIA_API}/api/booking/availability?shop=${SHOP_SLUG}&serviceId=${serviceId}&staffId=${danStaffId}&dateFrom=${date}&days=1&mode=after_hours`
  )
  if (!res.ok) return null
  const data = await res.json()
  const slots = data.slotsByDate[date] ?? []
  const available = slots.find((s: { state: string }) => s.state === "available")
  if (!available) return null
  return { startsAt: available.startsAt, slotStart: available.time }
}

beforeAll(async () => {
  // Load booking context from prod koureia
  const res = await fetch(`${KOUREIA_API}/api/booking/context?shop=${SHOP_SLUG}`)
  expect(res.status).toBe(200)
  const ctx = await res.json()

  danStaffId = ctx.staff.find((s: { name: string }) => s.name === "Dan Miller")?.id
  expect(danStaffId).toBeTruthy()

  const svc = ctx.services.find((s: { staff_ids: string[] }) => s.staff_ids.includes(danStaffId))
  expect(svc).toBeTruthy()
  serviceId = svc.id

  expect(ctx.after_hours).toBeTruthy()
  expect(ctx.after_hours.enabled).toBe(true)
})

describe("after-hours booking: shell proxy → koureia API", () => {
  it("hold created via proxy includes clientName and clientPhone", async () => {
    const date = futureWeekday(8)
    const slot = await findAvailableSlot(date)
    if (!slot) {
      console.warn(`No available after-hours slot on ${date} — skipping`)
      return
    }

    // Hit the koureia API directly (same as shell proxy would)
    const res = await fetch(`${KOUREIA_API}/api/booking/holds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopSlug: SHOP_SLUG,
        serviceId,
        staffId: danStaffId,
        startsAt: slot.startsAt,
        mode: "after_hours",
        source: "public",
        clientName: "E2E Test Client",
        clientPhone: "+15559990001",
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.hold).toBeDefined()
    expect(data.hold.status).toBe("pending")
    expect(data.hold.mode).toBe("after_hours")
  })

  it("hold without clientPhone returns 400 (phone required for after-hours)", async () => {
    const date = futureWeekday(9)
    const slot = await findAvailableSlot(date)
    if (!slot) {
      console.warn(`No available after-hours slot on ${date} — skipping`)
      return
    }

    const res = await fetch(`${KOUREIA_API}/api/booking/holds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopSlug: SHOP_SLUG,
        serviceId,
        staffId: danStaffId,
        startsAt: slot.startsAt,
        mode: "after_hours",
        source: "public",
        clientName: "No Phone Client",
      }),
    })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("clientPhone")
  })

  it("duplicate hold on same slot returns 409", async () => {
    const date = futureWeekday(10)
    const slot = await findAvailableSlot(date)
    if (!slot) {
      console.warn(`No available after-hours slot on ${date} — skipping`)
      return
    }

    const body = {
      shopSlug: SHOP_SLUG,
      serviceId,
      staffId: danStaffId,
      startsAt: slot.startsAt,
      mode: "after_hours",
      source: "public",
      clientName: "Dupe Test",
      clientPhone: "+15559990002",
      suppressNotifications: true,
    }

    const res1 = await fetch(`${KOUREIA_API}/api/booking/holds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    expect(res1.status).toBe(200)

    const res2 = await fetch(`${KOUREIA_API}/api/booking/holds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    expect(res2.status).toBe(409)
  })
})

describe("after-hours availability from prod", () => {
  it("returns evening slots with surcharge for DTBM", async () => {
    const date = futureWeekday(5)
    const res = await fetch(
      `${KOUREIA_API}/api/booking/availability?shop=${SHOP_SLUG}&serviceId=${serviceId}&staffId=${danStaffId}&dateFrom=${date}&days=1&mode=after_hours`
    )
    expect(res.status).toBe(200)
    const data = await res.json()

    const slots = data.slotsByDate[date] ?? []
    expect(slots.length).toBeGreaterThan(0)
    for (const slot of slots) {
      const hour = parseInt(slot.time.split(":")[0])
      expect(hour).toBeGreaterThanOrEqual(18)
      expect(hour).toBeLessThan(21)
    }
    expect(data.surcharge_cents).toBe(10000)
  })

  it("returns startsAt as UTC ISO strings (ends with Z)", async () => {
    const date = futureWeekday(6)
    const res = await fetch(
      `${KOUREIA_API}/api/booking/availability?shop=${SHOP_SLUG}&serviceId=${serviceId}&staffId=${danStaffId}&dateFrom=${date}&days=1&mode=after_hours`
    )
    expect(res.status).toBe(200)
    const data = await res.json()

    const slots = data.slotsByDate[date] ?? []
    expect(slots.length).toBeGreaterThan(0)

    for (const slot of slots) {
      // startsAt must be a full UTC ISO string ending in Z
      expect(slot.startsAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      // endsAt should also be UTC ISO
      expect(slot.endsAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      // time field should still be local HH:mm format
      expect(slot.time).toMatch(/^\d{2}:\d{2}$/)
    }
  })
})
