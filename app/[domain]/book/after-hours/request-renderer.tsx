"use client"

import { JSONUIProvider, Renderer, createStateStore } from "@json-render/react"
import { DayPicker } from "react-day-picker"
import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { registry } from "@/lib/json-render/registry"
import type { Spec } from "@json-render/core"
import type { BookingRequestVariant } from "../request-page"
import { buildRequestPayload, normalizePhoneForApi, type RequestState } from "@/lib/booking-payload"
import { createBookingHold } from "@/lib/booking-api"
import { fetchBulkAvailability } from "@/lib/availability"
import { cn, formatTime } from "@/lib/utils"

type RequestRendererProps = {
  spec: Spec
  shopId: string
  shopSlug: string
  apiUrl: string
  variant: BookingRequestVariant
  waitlistId?: string
}

function readInputValue(id: string) {
  if (typeof document === "undefined") return undefined
  const element = document.getElementById(id)
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    return undefined
  }
  const value = element.value.trim()
  return value || undefined
}

export function RequestRenderer({
  spec: initialSpec,
  shopId,
  shopSlug,
  apiUrl: _apiUrl,
  variant,
  waitlistId,
}: RequestRendererProps) {
  const initialState = (initialSpec.state ?? {}) as RequestState
  const packageConfig = initialState.afterHoursPackage
  const isPackageMode = variant === "after-hours" && initialState.afterHoursBookingMode === "package" && packageConfig
  const [spec, setSpec] = useState(initialSpec)
  const [error, setError] = useState<string | null>(null)
  const [packageSuccess, setPackageSuccess] = useState<null | {
    name: string
    priceDisplay: string
    logoUrl?: string | null
    slots: Array<{ starts_at: string; ends_at: string }>
  }>(null)
  const store = useMemo(() => createStateStore(initialSpec.state ?? {}), [initialSpec])
  const lastStaffIdRef = useRef<string | undefined>(
    (initialSpec.state as RequestState | undefined)?.selectedStaffId
  )

  // Filter displayed services by selected staff.
  // No staff selected → show all services.
  useEffect(() => {
    return store.subscribe(() => {
      const state = store.getSnapshot() as RequestState
      const staffId = state.selectedStaffId

      if (staffId === lastStaffIdRef.current) return
      lastStaffIdRef.current = staffId

      // Update URL to reflect staff selection (human-readable name)
      const url = new URL(window.location.href)
      if (staffId && staffId !== "any") {
        const staffList = (initialSpec.elements["staff-pick"]?.props as { staff?: { id: string; name: string }[] })?.staff
        const staffName = staffList?.find((s) => s.id === staffId)?.name
        url.searchParams.set("staff", staffName?.toLowerCase() ?? staffId)
      } else {
        url.searchParams.delete("staff")
      }
      window.history.replaceState({}, "", url.toString())

      const allServices = state.allFormattedServices
      const staffMap = state.serviceStaffMap
      if (!allServices || !staffMap) return

      const filtered = staffId && staffId !== "any"
        ? allServices.filter((s) => staffMap[s.id]?.includes(staffId))
        : allServices

      const effectiveServices = filtered.length > 0 ? filtered : allServices

      // Separate booking-mode services from regular services for the service-menu
      const MODE_PATTERNS = ["AFTER HOURS", "LOCAL AT HOME SERVICE"]
      const regularServices = effectiveServices.filter(
        (s) => !MODE_PATTERNS.some((p) => s.name.toUpperCase().includes(p))
      )

      // Split into primary/extras using the same heuristic as splitServices
      const EXTRA_PATTERNS = ["+", "waxing", "add-on", "therapy"]
      const isExtra = (s: { name: string; duration?: string; priceCents?: number }) => {
        const lower = s.name.toLowerCase()
        return s.name.startsWith("+") ||
          EXTRA_PATTERNS.some((p) => lower.includes(p)) ||
          false // duration/price heuristic requires raw values not available here
      }
      const primaryFiltered = regularServices.filter((s) => !isExtra(s))
      const extrasFiltered = regularServices.filter((s) => isExtra(s))

      setSpec((prev) => {
        const updates: typeof prev.elements = {}

        if (prev.elements["service-pick"]) {
          updates["service-pick"] = {
            ...prev.elements["service-pick"],
            props: {
              ...prev.elements["service-pick"].props,
              services: effectiveServices,
            },
          }
        }

        if (prev.elements["service-menu"]) {
          updates["service-menu"] = {
            ...prev.elements["service-menu"],
            props: {
              ...prev.elements["service-menu"].props,
              primary: primaryFiltered,
              extras: extrasFiltered,
            },
          }
        }

        return { ...prev, elements: { ...prev.elements, ...updates } }
      })
    })
  }, [store])

  async function handleSubmit() {
    setError(null)
    store.set("submitError", undefined)
    const state = store.getSnapshot() as RequestState
    const hydratedState: RequestState = {
      ...state,
      name: readInputValue("preference-name") ?? state.name,
      email: readInputValue("preference-email") ?? state.email,
      phone: readInputValue("preference-phone") ?? state.phone,
      notes: readInputValue("preference-notes") ?? state.notes,
    }

    if (hydratedState.name !== state.name) store.set("name", hydratedState.name)
    if (hydratedState.email !== state.email) store.set("email", hydratedState.email)
    if (hydratedState.phone !== state.phone) store.set("phone", hydratedState.phone)
    if (hydratedState.notes !== state.notes) store.set("notes", hydratedState.notes)

    if (variant === "after-hours") {
      await handleAfterHoursSubmit(hydratedState)
      return
    }

    // Waitlist validation — write to store so SubmitButton shows error inline
    if (!hydratedState.selectedServiceId) {
      store.set("submitError", "Please select a service.")
      return
    }
    if (!hydratedState.availabilityBlocks || hydratedState.availabilityBlocks.length === 0) {
      store.set("submitError", "Please select at least one time block.")
      return
    }
    if (!hydratedState.name?.trim()) {
      store.set("submitError", "Please enter your name.")
      return
    }
    if (!hydratedState.email?.trim()) {
      store.set("submitError", "Please enter your email.")
      return
    }

    const request = buildRequestPayload({ shopId, shopSlug, state: hydratedState, variant, waitlistId })
    try {
      const response = await fetch(request.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Something went wrong. Please try again.")
      }
      setSpec(buildWaitlistSuccessSpec(variant))
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.",
      )
    }
  }

  async function handleAfterHoursSubmit(state: RequestState) {
    if (!state.policyAccepted) {
      setError("Please acknowledge the booking terms to continue.")
      return
    }
    if (!state.selectedServiceId || !state.selectedStaffId || !state.preferredDate || !state.preferredSlotStart) {
      setError("Please select a service, staff member, date, and time.")
      return
    }
    if (!state.name?.trim() || !state.phone?.trim()) {
      setError("Please enter your name and phone number.")
      return
    }

    try {
      // Create hold on the time slot
      const selectedExtras = (state as Record<string, unknown>).selectedExtras as string[] | undefined
      await createBookingHold({
        shopSlug,
        serviceId: state.selectedServiceId,
        staffId: state.selectedStaffId,
        date: state.preferredDate,
        slotStart: state.preferredSlotStart,
        startsAt: state.preferredStartsAt,
        mode: "after_hours",
        clientName: state.name?.trim(),
        clientPhone: normalizePhoneForApi(state.phone),
        addonServiceIds: selectedExtras,
      })

      // Create booking request so staff is notified
      const request = buildRequestPayload({
        shopId, shopSlug, state, variant, waitlistId,
      })
      const requestResponse = await fetch(request.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
      })
      if (!requestResponse.ok) {
        // Hold was created successfully — slot is reserved. Log the
        // notification failure but still show success to the customer.
        console.error(
          "[koureia-shell] booking request failed after hold creation:",
          requestResponse.status
        )
      }

      const serviceName = state.allFormattedServices?.find(
        (s) => s.id === state.selectedServiceId
      )?.name
      setSpec(buildAfterHoursSuccessSpec({
        serviceName,
        date: state.preferredDate,
        slotStart: state.preferredSlotStart,
      }))
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.",
      )
    }
  }

  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView?.({ behavior: "smooth", block: "center" })
    }
  }, [error])

  if (isPackageMode && packageConfig) {
    return (
      <PackageModeForm
        apiUrl={_apiUrl}
        error={error}
        errorRef={errorRef}
        packageConfig={packageConfig}
        setError={setError}
        shopId={shopId}
        shopSlug={shopSlug}
        state={initialState}
        success={packageSuccess}
        variant={variant}
        waitlistId={waitlistId}
        onSuccess={setPackageSuccess}
      />
    )
  }

  return (
    <div className="w-full snap-y snap-proximity pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:mx-auto sm:max-w-md sm:px-4">
      <JSONUIProvider handlers={{ submit: handleSubmit }} registry={registry} store={store}>
        <Renderer registry={registry} spec={spec} />
      </JSONUIProvider>
      {error ? (
        <div
          ref={errorRef}
          className="mt-3 rounded-lg border border-red-900/30 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </div>
  )
}

function buildWaitlistSuccessSpec(variant: BookingRequestVariant): Spec {
  return {
    root: "container",
    elements: {
      container: { type: "Container", props: {}, children: ["confirmation"] },
      confirmation: {
        type: "ConfirmationMessage",
        props: {
          headline:
            variant === "waitlist" ? "You're on the waitlist!" : "Request received",
          body:
            variant === "waitlist"
              ? "We'll reach out when a slot opens."
              : "We'll review your preferences and follow up to confirm a time.",
        },
      },
    },
  }
}

function buildAfterHoursSuccessSpec(opts: {
  serviceName?: string
  date?: string
  slotStart?: string
}): Spec {
  const dateStr = opts.date
    ? new Date(opts.date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : ""

  return {
    root: "container",
    elements: {
      container: { type: "Container", props: {}, children: ["success"] },
      success: {
        type: "BookingSuccess",
        props: {
          serviceName: opts.serviceName ?? "Your service",
          date: dateStr,
          time: opts.slotStart ? formatTime(opts.slotStart) : "",
        },
      },
    },
  }
}

type PackageModeFormProps = {
  shopId: string
  shopSlug: string
  apiUrl: string
  variant: BookingRequestVariant
  waitlistId?: string
  state: RequestState
  packageConfig: NonNullable<RequestState["afterHoursPackage"]>
  error: string | null
  errorRef: RefObject<HTMLDivElement | null>
  setError: (value: string | null) => void
  success: {
    name: string
    priceDisplay: string
    logoUrl?: string | null
    slots: Array<{ starts_at: string; ends_at: string }>
  } | null
  onSuccess: (value: {
    name: string
    priceDisplay: string
    logoUrl?: string | null
    slots: Array<{ starts_at: string; ends_at: string }>
  }) => void
}

function PackageModeForm({
  shopId,
  shopSlug,
  apiUrl,
  variant,
  waitlistId,
  state,
  packageConfig,
  error,
  errorRef,
  setError,
  success,
  onSuccess,
}: PackageModeFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [slotMap, setSlotMap] = useState<Record<string, Array<{ start: string; end: string; startsAt?: string; endsAt?: string; available: boolean }>>>({})
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState<Array<{ starts_at: string; ends_at: string }>>([])
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [name, setName] = useState(state.name ?? "")
  const [phone, setPhone] = useState(state.phone ?? "")
  const [notes, setNotes] = useState(state.notes ?? "")
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const staffId = state.selectedStaffId
  const serviceId = state.packageBaseServiceId ?? state.selectedServiceId

  useEffect(() => {
    let cancelled = false
    async function loadAvailability() {
      if (!staffId || !serviceId) return
      setLoading(true)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const minDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      const result = await fetchBulkAvailability({
        apiUrl,
        shopSlug,
        serviceId,
        staffId,
        dateFrom: minDate.toISOString().slice(0, 10),
        days: 21,
        mode: "after_hours",
      })
      if (cancelled) return

      const nextMap: Record<string, Array<{ start: string; end: string; startsAt?: string; endsAt?: string; available: boolean }>> = {}
      const disabled: Date[] = []
      for (const [date, info] of Object.entries(result.dates ?? {})) {
        nextMap[date] = info.slots.filter((slot) => slot.available)
        if ((nextMap[date] ?? []).length === 0) {
          disabled.push(new Date(`${date}T12:00:00`))
        }
      }
      setSlotMap(nextMap)
      setUnavailableDates(disabled)
      if (!selectedDate) {
        const firstDate = Object.keys(nextMap)[0]
        if (firstDate) setSelectedDate(new Date(`${firstDate}T12:00:00`))
      }
      setLoading(false)
    }
    void loadAvailability()
    return () => {
      cancelled = true
    }
  }, [apiUrl, serviceId, shopSlug, staffId, selectedDate])

  if (success) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
        {success.logoUrl ? (
          <img src={success.logoUrl} alt="Shop logo" className="mb-6 h-14 w-auto object-contain" />
        ) : null}
        <div className="rounded-[2rem] border border-[var(--shell-border)] bg-[rgba(228,231,239,0.04)] px-6 py-8 text-center">
          <div
            aria-hidden="true"
            className="inline-flex size-14 items-center justify-center rounded-full bg-[rgba(199,164,106,0.14)] text-[1.8rem] text-[var(--shell-accent)]"
          >
            ✓
          </div>
          <h2 className="mt-4 text-[1.8rem] leading-[1.15] text-[var(--shell-text)] text-balance">
            Your package request is in review
          </h2>
          <p className="mt-3 text-[0.95rem] font-medium text-[var(--shell-text)]">
            {success.name} · {success.priceDisplay}
          </p>
          <div className="mt-4 rounded-xl border border-[rgba(199,164,106,0.15)] bg-[rgba(199,164,106,0.04)] px-4 py-3 text-left">
            <p className="text-[0.8rem] uppercase tracking-[0.06em] text-[var(--shell-text-muted)]">
              Preferred times
            </p>
            <div className="mt-2 space-y-2">
              {success.slots.map((slot) => (
                <p key={slot.starts_at} className="text-[0.9rem] text-[var(--shell-text)]">
                  {formatPackageSlot(slot.starts_at)}
                </p>
              ))}
            </div>
          </div>
          <p className="mx-auto mt-4 max-w-[28rem] text-[0.85rem] leading-[1.6] text-[var(--shell-text-muted)] text-pretty">
            We&apos;ll confirm one of your selected times by text.
          </p>
        </div>
      </div>
    )
  }

  const selectedDateKey = selectedDate ? selectedDate.toISOString().slice(0, 10) : null
  const visibleSlots = selectedDateKey ? slotMap[selectedDateKey] ?? [] : []
  const selectedDateCount = new Set(selectedSlots.map((slot) => slot.starts_at.slice(0, 10))).size

  async function handleSubmit() {
    setError(null)
    if (!staffId || !serviceId) {
      setError("This after-hours package is not configured correctly.")
      return
    }
    if (selectedSlots.length === 0) {
      setError("Please choose at least one preferred time slot.")
      return
    }
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.")
      return
    }
    if (!policyAccepted) {
      setError(`Please acknowledge the ${packageConfig.priceDisplay} package terms to continue.`)
      return
    }

    setSubmitting(true)
    try {
      await createBookingHold({
        shopSlug,
        serviceId,
        staffId,
        date: selectedSlots[0]!.starts_at.slice(0, 10),
        slotStart: selectedSlots[0]!.starts_at.slice(11, 16),
        startsAt: selectedSlots[0]!.starts_at,
        mode: "after_hours",
        clientName: name.trim(),
        clientPhone: normalizePhoneForApi(phone),
        preferredSlots: selectedSlots,
        packageAddonNames: selectedAddons,
      })

      const request = buildRequestPayload({
        shopId,
        shopSlug,
        variant,
        waitlistId,
        state: {
          ...state,
          name,
          phone,
          notes,
          preferredSlots: selectedSlots,
          afterHoursBookingMode: "package",
          packageBaseServiceId: serviceId,
        },
      })
      await fetch(request.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
      }).catch(() => null)

      onSuccess({
        name: packageConfig.name,
        priceDisplay: packageConfig.priceDisplay,
        logoUrl: packageConfig.logoUrl,
        slots: selectedSlots,
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      {packageConfig.logoUrl ? (
        <img src={packageConfig.logoUrl} alt="Shop logo" className="mb-4 h-14 w-auto object-contain" />
      ) : null}

      <div className="mb-4">
        <p className="text-base font-normal text-[var(--shell-accent)]">After-hours package</p>
        <h1 className="text-[1.5rem] font-semibold text-[var(--shell-text)]">{packageConfig.name}</h1>
        <p className="mt-1 text-[0.9rem] text-[var(--shell-text-muted)]">
          Select a few evening options and we&apos;ll confirm one by text.
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-[rgba(199,164,106,0.25)] bg-[rgba(199,164,106,0.06)] p-4">
        <p className="text-[0.75rem] uppercase tracking-[0.08em] text-[var(--shell-text-muted)]">Package</p>
        <p className="mt-1 text-[1.1rem] font-semibold text-[var(--shell-text)]">{packageConfig.name}</p>
        <p className="mt-1 text-[1.4rem] font-bold text-[var(--shell-accent)]">{packageConfig.priceDisplay}</p>
      </div>

      {packageConfig.addons.length > 0 ? (
        <div className="mt-4 rounded-xl border border-[var(--shell-border)] bg-[rgba(228,231,239,0.02)] p-3">
          <p className="text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-[var(--shell-text-muted)]">
            Complimentary add-ons
          </p>
          <div className="mt-3 space-y-2">
            {packageConfig.addons.map((addon) => {
              const checked = selectedAddons.includes(addon.name)
              return (
                <label key={addon.name} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--shell-border)] px-3 py-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setSelectedAddons((current) =>
                      checked ? current.filter((item) => item !== addon.name) : [...current, addon.name]
                    )}
                    className="mt-1 size-4 accent-[var(--shell-accent)]"
                  />
                  <span>
                    <span className="block text-[0.9rem] font-medium text-[var(--shell-text)]">{addon.name}</span>
                    <span className="block text-[0.8rem] text-[var(--shell-text-muted)]">
                      {addon.gratis ? "Complimentary" : "Included"}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-[var(--shell-border)] bg-[rgba(228,231,239,0.02)] p-3">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={unavailableDates}
          className="request-flow-day-picker mx-auto [--rdp-accent-background-color:rgba(199,164,106,0.14)] [--rdp-accent-color:var(--shell-accent)]"
        />
      </div>

      <div className="mt-3">
        {loading ? (
          <p className="py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">Loading availability…</p>
        ) : !selectedDateKey ? (
          <p className="py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">Select a date to see evening times.</p>
        ) : visibleSlots.length === 0 ? (
          <p className="py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">No available after-hours times on this date.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2 max-sm:grid-cols-1">
            {visibleSlots.map((slot) => {
              const checked = selectedSlots.some((item) => item.starts_at === slot.startsAt)
              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  className={cn(
                    "rounded-[var(--shell-radius-sm)] border border-[var(--shell-border-strong)] bg-[rgba(228,231,239,0.02)] px-[0.4rem] py-2 text-center text-[0.9rem] font-semibold tabular-nums text-[var(--shell-text)]",
                    checked && "border-[var(--shell-accent)] bg-[var(--shell-accent)] text-[var(--shell-accent-contrast)]"
                  )}
                  onClick={() => setSelectedSlots((current) =>
                    checked
                      ? current.filter((item) => item.starts_at !== slot.startsAt)
                      : slot.startsAt
                        ? [...current, { starts_at: slot.startsAt, ends_at: slot.endsAt ?? slot.startsAt }].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
                        : current
                  )}
                >
                  {formatTime(slot.start)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[rgba(199,164,106,0.2)] bg-[rgba(199,164,106,0.04)] px-3 py-[0.65rem]">
        <p className="text-[0.85rem] font-medium text-[var(--shell-text)]">
          You selected {selectedSlots.length} time slot{selectedSlots.length === 1 ? "" : "s"} across {selectedDateCount} date{selectedDateCount === 1 ? "" : "s"}.
        </p>
        {selectedSlots.length > 0 ? (
          <div className="mt-2 space-y-1 text-[0.8rem] text-[var(--shell-text-muted)]">
            {selectedSlots.map((slot) => (
              <p key={slot.starts_at}>{formatPackageSlot(slot.starts_at)}</p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3 rounded-xl border border-[var(--shell-border)] bg-[rgba(228,231,239,0.02)] p-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-[var(--shell-border)] bg-transparent px-3 py-2 text-[var(--shell-text)]"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone number"
          className="w-full rounded-lg border border-[var(--shell-border)] bg-transparent px-3 py-2 text-[var(--shell-text)]"
        />
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Special requests or notes"
          className="min-h-24 w-full rounded-lg border border-[var(--shell-border)] bg-transparent px-3 py-2 text-[var(--shell-text)]"
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--shell-border)] bg-[rgba(228,231,239,0.02)] px-3 py-3">
        <input
          type="checkbox"
          checked={policyAccepted}
          onChange={(event) => setPolicyAccepted(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--shell-accent)]"
        />
        <span className="text-[0.8rem] leading-[1.5] text-[var(--shell-text-muted)]">
          I acknowledge the {packageConfig.priceDisplay} package price and agree to receive booking-related texts.
        </span>
      </label>

      <div className="mt-4">
        <p className="mb-2 text-[0.75rem] leading-[1.5] text-[var(--shell-text-subtle)] text-pretty">
          By submitting, you agree to receive appointment-related messages via text from this shop (powered by Koureia). Message &amp; data rates may apply. Reply STOP to opt out.
        </p>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          className="mb-2 inline-flex min-h-11 w-full items-center justify-center rounded-full border-0 bg-[var(--shell-accent)] px-5 py-[0.65rem] text-[0.9rem] font-bold text-[var(--shell-accent-contrast)] shadow-[0_12px_28px_rgba(199,164,106,0.15)] hover:-translate-y-px hover:bg-[var(--shell-accent-strong)] disabled:cursor-wait disabled:opacity-72"
        >
          {submitting ? "Booking..." : "Confirm Booking"}
        </button>
      </div>

      {error ? (
        <div
          ref={errorRef}
          className="mt-3 rounded-lg border border-red-900/30 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </div>
  )
}

function formatPackageSlot(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
