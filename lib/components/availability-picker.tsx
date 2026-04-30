"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { DayPicker } from "react-day-picker"
import { fetchBulkAvailability, type AvailabilitySlot } from "@/lib/availability"
import { cn, formatTime } from "@/lib/utils"

type AvailabilityPickerProps = {
  onSlotSelect: (date: string, slot: AvailabilitySlot) => void
  apiUrl?: string
  shopSlug: string
  serviceId?: string
  staffId?: string
  minAdvanceHours?: number
  shopTimezone?: string
  mode?: "regular" | "after_hours"
}

type SlotCache = Map<string, AvailabilitySlot[]>

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function AvailabilityPicker({
  onSlotSelect,
  apiUrl,
  shopSlug,
  serviceId,
  staffId,
  minAdvanceHours = 24,
  shopTimezone,
  mode = "after_hours",
}: AvailabilityPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [timezone, setTimezone] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [loading, setLoading] = useState(false)
  const [prefetching, setPrefetching] = useState(false)
  const [error, setError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const slotCacheRef = useRef<SlotCache>(new Map())
  // Track which serviceId+staffId combo the cache is for
  const cacheKeyRef = useRef<string>("")

  const today = new Date()
  const minDate = new Date(today.getTime() + minAdvanceHours * 60 * 60 * 1000)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)

  // Dates that have zero available slots (for disabling in calendar)
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([])

  const prefetchAvailability = useCallback(
    async (svcId: string, stfId?: string) => {
      const newCacheKey = `${svcId}:${stfId ?? ""}`
      if (cacheKeyRef.current === newCacheKey) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      cacheKeyRef.current = newCacheKey
      slotCacheRef.current = new Map()
      setUnavailableDates([])
      setPrefetching(true)
      setError(false)

      try {
        const result = await fetchBulkAvailability({
          apiUrl,
          shopSlug,
          serviceId: svcId,
          staffId: stfId,
          dateFrom: toDateString(minDate),
          days: 14,
          mode,
          signal: controller.signal,
        })

        if (result.error) {
          setError(true)
          setPrefetching(false)
          return
        }

        const cache: SlotCache = new Map()
        const noSlotDates: Date[] = []

        for (const [dateStr, info] of Object.entries(result.dates)) {
          cache.set(dateStr, info.slots)
          if (info.availableCount === 0) {
            noSlotDates.push(new Date(dateStr + "T12:00:00"))
          }
        }

        slotCacheRef.current = cache
        setUnavailableDates(noSlotDates)
        setTimezone(shopTimezone ?? result.timezone)

        // If a date is already selected, show its cached slots
        if (selectedDate) {
          const dateStr = toDateString(selectedDate)
          const cached = cache.get(dateStr)
          if (cached) {
            setSlots(cached)
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return
        setError(true)
      } finally {
        if (abortRef.current === controller) {
          setPrefetching(false)
        }
      }
    },
    [apiUrl, shopSlug, minDate, mode, shopTimezone, selectedDate]
  )

  // Pre-fetch when serviceId + staffId are available
  useEffect(() => {
    if (serviceId) {
      prefetchAvailability(serviceId, staffId)
    }
  }, [serviceId, staffId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return
      setSelectedDate(date)
      setSelectedSlot(null)
      setError(false)

      const dateStr = toDateString(date)
      const cached = slotCacheRef.current.get(dateStr)

      if (cached) {
        // Instant — show cached slots, no loading
        setSlots(cached)
        setLoading(false)
      } else {
        // Date not in cache (outside prefetch window) — show empty
        setSlots([])
        setLoading(false)
      }
    },
    []
  )

  const handleSlotClick = useCallback(
    (slot: AvailabilitySlot) => {
      if (!slot.available || !selectedDate) return
      setSelectedSlot(slot)
      onSlotSelect(toDateString(selectedDate), slot)
    },
    [selectedDate, onSlotSelect]
  )

  return (
    <div className="mt-4 snap-start scroll-mt-2">
      <div className="rounded-xl border border-[var(--shell-border)] bg-[rgba(228,231,239,0.02)] p-3">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={[
            { before: minDate },
            { after: maxDate },
            { dayOfWeek: [0] },
            ...unavailableDates,
          ]}
          fromDate={minDate}
          toDate={maxDate}
          className="request-flow-day-picker mx-auto [--rdp-accent-background-color:rgba(199,164,106,0.14)] [--rdp-accent-color:var(--shell-accent)] [--rdp-day-height:2.5rem] [--rdp-day-width:2.5rem] [--rdp-selected-font:700_1rem/1_inherit]"
          formatters={{
            formatWeekdayName: (date) => date.toLocaleDateString("en-US", { weekday: "narrow" }),
          }}
        />
      </div>

      <div className="mt-3">
        {prefetching && (
          <p className="px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
            Loading availability…
          </p>
        )}

        {!prefetching && !selectedDate && !error && (
          <p className="px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
            Select a date to see available times
          </p>
        )}

        {selectedDate && loading && (
          <p className="px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
            Loading available times…
          </p>
        )}

        {!prefetching && error && (
          <p className="px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
            Couldn't load availability. Please try another date.
          </p>
        )}

        {selectedDate && !loading && !prefetching && !error && slots.length === 0 && (
          <p className="px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
            No available times on this date.
          </p>
        )}

        {selectedDate && !loading && !prefetching && !error && slots.length > 0 && (
          <>
            <GroupedSlots
              handleSlotClick={handleSlotClick}
              selectedSlot={selectedSlot}
              slots={slots}
            />
            {timezone && (
              <p className="mt-3 text-center text-[0.8rem] text-[var(--shell-text-subtle)]">
                Times shown in {timezone.replace(/_/g, " ")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function getSlotPeriod(slot: AvailabilitySlot) {
  const hour = Number(slot.start.slice(0, 2))
  if (hour < 12) return "Morning"
  if (hour < 17) return "Afternoon"
  return "Evening"
}

function SlotButton({
  handleSlotClick,
  selectedSlot,
  slot,
}: {
  handleSlotClick: (slot: AvailabilitySlot) => void
  selectedSlot: AvailabilitySlot | null
  slot: AvailabilitySlot
}) {
  return (
    <button
      key={slot.start}
      type="button"
      disabled={!slot.available}
      className={cn(
        "cursor-pointer rounded-[var(--shell-radius-sm)] border border-[var(--shell-border-strong)] bg-[rgba(228,231,239,0.02)] px-[0.4rem] py-2 text-center text-[0.9rem] font-semibold tabular-nums text-[var(--shell-text)] transition-[background,border-color] duration-150 ease-[var(--shell-transition)] hover:border-[var(--shell-accent)] hover:bg-[rgba(228,231,239,0.06)] disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through disabled:hover:border-[var(--shell-border-strong)] disabled:hover:bg-[rgba(228,231,239,0.02)] max-sm:p-[0.85rem]",
        selectedSlot?.start === slot.start && "border-[var(--shell-accent)] bg-[var(--shell-accent)] font-bold text-[var(--shell-accent-contrast)] hover:border-[var(--shell-accent-strong)] hover:bg-[var(--shell-accent-strong)]"
      )}
      onClick={() => handleSlotClick(slot)}
    >
      {formatTime(slot.start)}
    </button>
  )
}

function GroupedSlots({
  handleSlotClick,
  selectedSlot,
  slots,
}: {
  handleSlotClick: (slot: AvailabilitySlot) => void
  selectedSlot: AvailabilitySlot | null
  slots: AvailabilitySlot[]
}) {
  if (slots.length <= 8) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2 max-sm:grid-cols-1">
        {slots.map((slot) => (
          <SlotButton
            key={slot.start}
            handleSlotClick={handleSlotClick}
            selectedSlot={selectedSlot}
            slot={slot}
          />
        ))}
      </div>
    )
  }

  const groups = ["Morning", "Afternoon", "Evening"].map((period) => ({
    period,
    slots: slots.filter((slot) => getSlotPeriod(slot) === period),
  })).filter((group) => group.slots.length > 0)

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section key={group.period}>
          <p className="mb-2 text-[0.75rem] font-semibold uppercase tracking-[0.05em] text-[var(--shell-text-muted)]">
            {group.period}
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2 max-sm:grid-cols-1">
            {group.slots.map((slot) => (
              <SlotButton
                key={slot.start}
                handleSlotClick={handleSlotClick}
                selectedSlot={selectedSlot}
                slot={slot}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
