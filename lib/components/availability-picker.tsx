"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { DayPicker } from "react-day-picker"
import { fetchAvailability, type AvailabilitySlot } from "@/lib/availability"
import { cn, formatTime } from "@/lib/utils"

type AvailabilityPickerProps = {
  onSlotSelect: (date: string, slot: AvailabilitySlot) => void
  apiUrl?: string
  shopSlug: string
  staffId?: string
  minAdvanceHours?: number
  shopTimezone?: string
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function AvailabilityPicker({
  onSlotSelect,
  apiUrl,
  shopSlug,
  staffId,
  minAdvanceHours = 24,
  shopTimezone,
}: AvailabilityPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [timezone, setTimezone] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const today = new Date()
  const minDate = new Date(today.getTime() + minAdvanceHours * 60 * 60 * 1000)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)

  const handleDateSelect = useCallback(
    async (date: Date | undefined) => {
      if (!date) return
      setSelectedDate(date)
      setSelectedSlot(null)
      setError(false)
      setLoading(true)

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetchAvailability({
          apiUrl,
          shopSlug,
          staffId,
          date: toDateString(date),
          signal: controller.signal,
        })
        if (response.error) {
          setSlots([])
          setError(true)
        } else {
          setSlots(response.slots)
          setTimezone(shopTimezone ?? response.timezone)
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return
        setSlots([])
        setError(true)
      } finally {
        // Only clear loading if this is still the active request
        if (abortRef.current === controller) {
          setLoading(false)
        }
      }
    },
    [apiUrl, shopSlug, staffId, shopTimezone]
  )

  // Refetch when staffId changes and a date is already selected
  const prevStaffIdRef = useRef(staffId)
  useEffect(() => {
    if (prevStaffIdRef.current === staffId) return
    prevStaffIdRef.current = staffId
    if (selectedDate) {
      handleDateSelect(selectedDate)
    }
  }, [staffId, selectedDate, handleDateSelect])

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
          disabled={[{ before: minDate }, { after: maxDate }, { dayOfWeek: [0] }]}
          fromDate={minDate}
          toDate={maxDate}
          className="request-flow-day-picker mx-auto [--rdp-accent-background-color:rgba(199,164,106,0.14)] [--rdp-accent-color:var(--shell-accent)] [--rdp-day-height:2.5rem] [--rdp-day-width:2.5rem] [--rdp-selected-font:700_1rem/1_inherit]"
          formatters={{
            formatWeekdayName: (date) => date.toLocaleDateString("en-US", { weekday: "narrow" }),
          }}
        />
      </div>

      <div className="mt-3">
        {!selectedDate && (
          <p className="px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
            Select a date to see available times
          </p>
        )}

        {selectedDate && loading && (
          <p className="px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
            Loading available times…
          </p>
        )}

        {selectedDate && !loading && error && (
          <p className="px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
            Couldn't load availability. Please try another date.
          </p>
        )}

        {selectedDate && !loading && !error && slots.length === 0 && (
          <p className="px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
            No available times on this date.
          </p>
        )}

        {selectedDate && !loading && !error && slots.length > 0 && (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2 max-sm:grid-cols-1">
              {slots.map((slot) => (
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
              ))}
            </div>
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
