"use client"

import { useState, useCallback } from "react"
import { DayPicker } from "react-day-picker"
import {
  mockAvailabilityResponse,
  type AvailabilitySlot,
} from "@/lib/mock-availability"

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
    <div className="availability-picker">
      <div className="availability-picker__calendar">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={[{ before: minDate }, { after: maxDate }, { dayOfWeek: [0] }]}
          fromDate={minDate}
          toDate={maxDate}
          className="availability-picker__rdp"
          formatters={{
            formatWeekdayName: (date) => date.toLocaleDateString("en-US", { weekday: "narrow" }),
          }}
        />
      </div>

      <div className="availability-picker__slots">
        {!selectedDate && (
          <p className="availability-picker__hint">
            Select a date to see available times
          </p>
        )}

        {selectedDate && slots.length === 0 && (
          <p className="availability-picker__empty">
            No available times on this date.
          </p>
        )}

        {selectedDate && slots.length > 0 && (
          <>
            <div className="availability-picker__slot-grid">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  disabled={!slot.available}
                  className={`availability-picker__slot${
                    selectedSlot?.start === slot.start
                      ? " availability-picker__slot--selected"
                      : ""
                  }${!slot.available ? " availability-picker__slot--taken" : ""}`}
                  onClick={() => handleSlotClick(slot)}
                >
                  {formatSlotTime(slot.start)}
                </button>
              ))}
            </div>
            {timezone && (
              <p className="availability-picker__tz">
                Times shown in {timezone.replace(/_/g, " ")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
