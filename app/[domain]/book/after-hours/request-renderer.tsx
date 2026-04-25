"use client"

import { JSONUIProvider, Renderer, createStateStore } from "@json-render/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { registry } from "@/lib/json-render/registry"
import type { Spec } from "@json-render/core"
import type { BookingRequestVariant } from "../request-page"
import { buildRequestPayload, normalizePhoneForApi, type RequestState } from "@/lib/booking-payload"
import { createBookingHold } from "@/lib/booking-api"
import { formatTime } from "@/lib/utils"

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
  const [spec, setSpec] = useState(initialSpec)
  const [error, setError] = useState<string | null>(null)
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
              primary: effectiveServices,
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
