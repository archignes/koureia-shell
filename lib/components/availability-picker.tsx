"use client"

import { useState, useCallback } from "react"
import { DayPicker } from "react-day-picker"
import {
  mockAvailabilityResponse,
  type AvailabilitySlot,
} from "@/lib/mock-availability"
import { cn } from "@/lib/utils"

type AvailabilityPickerProps = {
  onSlotSelect: (date: string, slot: AvailabilitySlot) => void
  minAdvanceHours?: number
  shopTimezone?: string
}

function formatSlotTime(time24: string) {
  const [h, m] = time24.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function AvailabilityPicker({
  onSlotSelect,
  minAdvanceHours = 24,
  shopTimezone,
}: AvailabilityPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [timezone, setTimezone] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null
  )

  const today = new Date()
  const minDate = new Date(today.getTime() + minAdvanceHours * 60 * 60 * 1000)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return
      setSelectedDate(date)
      setSelectedSlot(null)

      const response = mockAvailabilityResponse(toDateString(date))
      setSlots(response.slots)
      setTimezone(shopTimezone ?? response.timezone)
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

        {selectedDate && slots.length === 0 && (
          <p className="px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
            No available times on this date.
          </p>
        )}

        {selectedDate && slots.length > 0 && (
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
                  {formatSlotTime(slot.start)}
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
