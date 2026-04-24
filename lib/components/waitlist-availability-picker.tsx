"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type SiteHours = {
  dayOfWeek: number
  startTime: string
  endTime: string
  isClosed: boolean
}

type AvailabilityBlock = {
  date: string
  start_time: string
  end_time: string
}

type WaitlistAvailabilityPickerProps = {
  hours: SiteHours[]
  horizonDays?: number
  timezone?: string
  onChange: (blocks: AvailabilityBlock[]) => void
}

type GridDay = {
  date: string
  dayOfWeek: number
  label: string
  shortDate: string
  hours: SiteHours | undefined
}

function normalizeTime(value: string) {
  return value.slice(0, 5)
}

function timeToMinutes(value: string) {
  const [hours, minutes] = normalizeTime(value).split(":").map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

function formatSlotLabel(minutes: number) {
  if (minutes % 60 !== 0) return ""
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const suffix = hours >= 12 ? "PM" : "AM"
  const normalizedHours = hours % 12 || 12
  return `${normalizedHours}:${String(mins).padStart(2, "0")}${suffix}`
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildDays(hours: SiteHours[], horizonDays: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: horizonDays }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() + index)
    const dayOfWeek = date.getDay()
    return {
      date: toDateKey(date),
      dayOfWeek,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      shortDate: date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      hours: hours.find((entry) => entry.dayOfWeek === dayOfWeek),
    }
  })
}

function isSelectable(day: GridDay, minutes: number) {
  if (!day.hours || day.hours.isClosed) return false
  const start = timeToMinutes(day.hours.startTime)
  const end = timeToMinutes(day.hours.endTime)
  return minutes >= start && minutes + 60 <= end
}

function toggleAllForDay(selected: Set<string>, day: GridDay, rows: number[]) {
  const next = new Set(selected)
  const dayKeys = rows
    .filter((minutes) => isSelectable(day, minutes))
    .map((minutes) => `${day.date}|${minutes}`)
  const shouldSelect = dayKeys.some((key) => !selected.has(key))

  for (const key of dayKeys) {
    if (shouldSelect) next.add(key)
    else next.delete(key)
  }

  return next
}

function buildBlocks(selected: Set<string>) {
  const byDate = new Map<string, number[]>()
  for (const key of selected) {
    const [date, minutesString] = key.split("|")
    const minutes = Number(minutesString)
    const list = byDate.get(date) ?? []
    list.push(minutes)
    byDate.set(date, list)
  }

  return Array.from(byDate.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([date, minutes]) => {
      const sorted = [...minutes].sort((a, b) => a - b)
      if (sorted.length === 0) return []

      const blocks: AvailabilityBlock[] = []
      let start = sorted[0]
      let previous = sorted[0]

      for (let index = 1; index <= sorted.length; index += 1) {
        const current = sorted[index]
        if (current === previous + 60) {
          previous = current
          continue
        }

        blocks.push({
          date,
          start_time: minutesToTime(start),
          end_time: minutesToTime(previous + 60),
        })

        start = current
        previous = current
      }

      return blocks
    })
}

export function WaitlistAvailabilityPicker({
  hours,
  horizonDays = 7,
  timezone,
  onChange,
}: WaitlistAvailabilityPickerProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const footerRef = useRef<HTMLDivElement | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const onChangeRef = useRef(onChange)
  const [isFooterVisible, setIsFooterVisible] = useState(false)
  const [dragState, setDragState] = useState<{
    anchorDay: number
    anchorRow: number
    value: boolean
  } | null>(null)

  const days = useMemo(() => buildDays(hours, horizonDays), [hours, horizonDays])
  const [earliest, latest] = useMemo(() => {
    const openDays = hours.filter((entry) => !entry.isClosed)
    if (openDays.length === 0) return [9 * 60, 17 * 60]
    return [
      Math.min(...openDays.map((entry) => timeToMinutes(entry.startTime))),
      Math.max(...openDays.map((entry) => timeToMinutes(entry.endTime))),
    ]
  }, [hours])
  const rows = useMemo(() => {
    const values: number[] = []
    for (let minutes = earliest; minutes < latest; minutes += 60) values.push(minutes)
    return values
  }, [earliest, latest])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onChangeRef.current(buildBlocks(selected))
  }, [selected])

  useEffect(() => {
    const footer = footerRef.current
    if (!footer) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry?.isIntersecting ?? false),
      { threshold: 0.25 },
    )

    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function handlePointerUp() {
      setDragState(null)
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragState) return

      const target = document.elementFromPoint(event.clientX, event.clientY)
      const cell = target instanceof Element
        ? target.closest<HTMLElement>("[data-grid-cell='true']")
        : null
      if (!cell) return

      const dayIndex = Number(cell.dataset.dayIndex)
      const rowIndex = Number(cell.dataset.rowIndex)
      if (Number.isNaN(dayIndex) || Number.isNaN(rowIndex)) return

      applyDrag(dayIndex, rowIndex)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [dragState, days, rows])

  function applyDrag(targetDay: number, targetRow: number) {
    if (!dragState) return

    const dayStart = Math.min(dragState.anchorDay, targetDay)
    const dayEnd = Math.max(dragState.anchorDay, targetDay)
    const rowStart = Math.min(dragState.anchorRow, targetRow)
    const rowEnd = Math.max(dragState.anchorRow, targetRow)

    setSelected((current) => {
      const next = new Set(current)
      for (let dayIndex = dayStart; dayIndex <= dayEnd; dayIndex += 1) {
        const day = days[dayIndex]
        for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
          const minutes = rows[rowIndex]
          if (!day || minutes == null || !isSelectable(day, minutes)) continue
          const key = `${day.date}|${minutes}`
          if (dragState.value) next.add(key)
          else next.delete(key)
        }
      }
      return next
    })
  }

  function scrollToNextSection() {
    const nextSection = sectionRef.current?.nextElementSibling
    if (!(nextSection instanceof HTMLElement)) return
    nextSection.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const selectionText =
    selected.size === 0 ? "Select at least one slot" : `${selected.size} slots selected`
  const timezoneText = timezone ? `Times shown in ${timezone.replace(/_/g, " ")}` : null

  return (
    <section
      ref={sectionRef}
      className="mt-4 -mx-4 snap-start scroll-mt-2 border-y border-[var(--shell-border)] bg-[rgba(228,231,239,0.02)] px-4 py-3 sm:mx-0 sm:rounded-xl sm:border sm:p-3"
    >
      <div className="mb-3">
        <p className="text-[0.82rem] font-semibold text-[var(--shell-text)]">
          When are you free?
        </p>
        <p className="mt-1 text-[0.75rem] leading-[1.5] text-[var(--shell-text-muted)]">
          Tap or drag 1-hour blocks. Day headers toggle the full day.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid min-w-[24.5rem] gap-1 sm:min-w-[31rem]"
          style={{ gridTemplateColumns: `3rem repeat(${days.length}, minmax(3rem, 1fr))` }}
        >
          <div className="sticky left-0 z-20 bg-[rgba(15,17,23,0.96)]" />
          {days.map((day) => {
            const selectableCount = rows.filter((minutes) => isSelectable(day, minutes)).length
            const selectedCount = rows.filter((minutes) => selected.has(`${day.date}|${minutes}`)).length
            const active = selectableCount > 0 && selectedCount === selectableCount
            return (
              <button
                key={day.date}
                type="button"
                className={cn(
                  "min-h-9 rounded-md border px-1.5 py-1.5 text-center text-[0.68rem] transition-colors sm:min-h-11 sm:rounded-lg sm:px-2 sm:py-2 sm:text-[0.72rem]",
                  active
                    ? "border-[var(--shell-accent)] bg-[var(--shell-accent)] text-[var(--shell-accent-contrast)]"
                    : "border-[var(--shell-border-strong)] bg-[var(--shell-bg-elevated)] text-[var(--shell-text)]",
                  selectableCount === 0 && "cursor-not-allowed opacity-45",
                )}
                disabled={selectableCount === 0}
                onClick={() => setSelected((current) => toggleAllForDay(current, day, rows))}
              >
                <span className="block font-semibold">{day.label}</span>
                <span className="block text-[0.68rem] opacity-80">{day.shortDate}</span>
              </button>
            )
          })}

          {rows.flatMap((minutes, rowIndex) => [
            <div
              key={`label-${minutes}`}
              className="sticky left-0 z-10 flex min-h-9 items-center justify-end bg-[rgba(15,17,23,0.96)] pr-1 text-[0.62rem] text-[var(--shell-text-subtle)] sm:min-h-11 sm:text-[0.68rem]"
            >
              {formatSlotLabel(minutes)}
            </div>,
            ...days.map((day, dayIndex) => {
              const selectable = isSelectable(day, minutes)
              const key = `${day.date}|${minutes}`
              const active = selected.has(key)
              return (
                <button
                  key={key}
                  type="button"
                  data-grid-cell="true"
                  data-day-index={dayIndex}
                  data-row-index={rowIndex}
                  className={cn(
                    "min-h-9 rounded-[0.55rem] border transition-colors sm:min-h-11 sm:rounded-md",
                    selectable
                      ? "touch-none border-[var(--shell-border-strong)] bg-[rgba(228,231,239,0.02)] hover:border-[var(--shell-accent)] hover:bg-[rgba(199,164,106,0.08)]"
                      : "cursor-default border-[rgba(228,231,239,0.04)] bg-[rgba(228,231,239,0.015)] opacity-45",
                    active && "border-[var(--shell-accent)] bg-[var(--shell-accent)] text-[var(--shell-accent-contrast)]",
                  )}
                  disabled={!selectable}
                  onPointerDown={(event) => {
                    if (!selectable) return
                    event.preventDefault()
                    event.currentTarget.setPointerCapture?.(event.pointerId)
                    const nextValue = !active
                    setDragState({ anchorDay: dayIndex, anchorRow: rowIndex, value: nextValue })
                    setSelected((current) => {
                      const next = new Set(current)
                      if (nextValue) next.add(key)
                      else next.delete(key)
                      return next
                    })
                  }}
                  onPointerEnter={() => applyDrag(dayIndex, rowIndex)}
                />
              )
            }),
          ])}
        </div>
      </div>

      <div
        ref={footerRef}
        className="mt-3 flex items-center justify-between gap-3 text-[0.72rem] text-[var(--shell-text-subtle)]"
      >
        <span>{selectionText}</span>
        {timezoneText ? <span>{timezoneText}</span> : null}
      </div>

      {!isFooterVisible ? (
        <div className="pointer-events-none sticky bottom-3 z-30 mt-4 sm:hidden">
          <div className="pointer-events-auto rounded-2xl border border-[var(--shell-border-strong)] bg-[rgba(15,17,23,0.94)] px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.32)] backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 text-[0.72rem] text-[var(--shell-text-subtle)]">
              <span>{selectionText}</span>
              {timezoneText ? <span>{timezoneText}</span> : null}
            </div>
            <button
              type="button"
              onClick={scrollToNextSection}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--shell-border-strong)] bg-[rgba(228,231,239,0.04)] px-4 py-2 text-[0.82rem] font-semibold text-[var(--shell-text)]"
            >
              <span>Next</span>
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
