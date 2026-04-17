"use client"

import { JSONUIProvider, Renderer, createStateStore } from "@json-render/react"
import { useMemo, useState } from "react"
import type { Spec } from "@json-render/core"
import { registry } from "@/lib/json-render/registry"
import type { BookingRequestVariant } from "../request-page"

type RequestRendererProps = {
  spec: Spec
  shopId: string
  shopSlug: string
  apiUrl: string
  variant: BookingRequestVariant
  waitlistId?: string
}

type RequestSource = "after-hours" | "waitlist" | "sms-refinement"
type TimeWindow = "morning" | "afternoon" | "evening" | "anytime"

type RequestState = {
  selectedServiceId?: string
  selectedStaffId?: string
  name?: string
  email?: string
  phone?: string
  dateRange?: string
  flexibleDates?: string
  timeWindow?: TimeWindow
  notes?: string
  source?: RequestSource
}

export function RequestRenderer({
  spec: initialSpec,
  shopId,
  shopSlug,
  apiUrl,
  variant,
  waitlistId,
}: RequestRendererProps) {
  const [spec, setSpec] = useState(initialSpec)
  const [error, setError] = useState<string | null>(null)
  const store = useMemo(() => createStateStore(initialSpec.state ?? {}), [initialSpec])

  async function handleSubmit() {
    setError(null)

    const state = store.getSnapshot() as RequestState
    if (
      variant === "after-hours" &&
      !(toNonEmptyString(state.dateRange) && isTimeWindow(state.timeWindow))
    ) {
      setError("Select a preferred date and time window before sending your request.")
      return
    }
    const request = buildRequestPayload({
      shopId,
      shopSlug,
      state,
      variant,
      waitlistId,
    })

    try {
      const response = await fetch(`${apiUrl}${request.path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request.body),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Something went wrong. Please try again.")
      }

      setSpec(buildConfirmationSpec(variant))
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.",
      )
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      {error ? (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      <JSONUIProvider handlers={{ submit: handleSubmit }} registry={registry} store={store}>
        <Renderer registry={registry} spec={spec} />
      </JSONUIProvider>
    </div>
  )
}

function buildRequestPayload({
  shopId,
  shopSlug,
  state,
  variant,
  waitlistId,
}: {
  shopId: string
  shopSlug: string
  state: RequestState
  variant: BookingRequestVariant
  waitlistId?: string
}) {
  if (variant === "waitlist") {
    return {
      path: "/api/booking/waitlist",
      body: {
        shopSlug,
        clientName: toNonEmptyString(state.name),
        clientEmail: toNonEmptyString(state.email),
        clientPhone: normalizePhoneForApi(state.phone),
        serviceId: toNonEmptyString(state.selectedServiceId),
        staffId: toNullableString(state.selectedStaffId),
        flexibleDates: toNonEmptyString(state.flexibleDates),
        notes: toNonEmptyString(state.notes),
        source: "public" as const,
      },
    }
  }

  return {
    path: "/api/booking/request",
    body: {
      shopId,
      serviceId: toNonEmptyString(state.selectedServiceId),
      staffId: toNonEmptyString(state.selectedStaffId),
      clientName: toNonEmptyString(state.name),
      clientPhone: normalizePhoneForApi(state.phone),
      preferredDate: toNonEmptyString(state.dateRange),
      timeWindow: isTimeWindow(state.timeWindow) ? state.timeWindow : undefined,
      notes: toNonEmptyString(state.notes),
      source: isRequestSource(state.source) ? state.source : "waitlist",
      waitlistId,
    },
  }
}

function buildConfirmationSpec(variant: BookingRequestVariant): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "Container",
        props: {},
        children: ["confirmation"],
      },
      confirmation: {
        type: "ConfirmationMessage",
        props: {
          headline:
            variant === "waitlist" ? "You're on the waitlist!" : "Request received",
          body:
            variant === "waitlist"
              ? "We'll reach out when a slot opens."
              : "We’ll review your preferences and follow up to confirm a time.",
        },
      },
    },
  }
}

function toNonEmptyString(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function toNullableString(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function normalizePhoneForApi(value: string | undefined) {
  const trimmed = toNonEmptyString(value)
  if (!trimmed) return undefined
  if (/^\+[1-9]\d{1,14}$/.test(trimmed)) return trimmed

  const digits = trimmed.replace(/\D/g, "")

  if (digits.length === 10) {
    return `+1${digits}`
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`
  }

  return trimmed
}

function isRequestSource(value: string | undefined): value is RequestSource {
  return value === "after-hours" || value === "waitlist" || value === "sms-refinement"
}

function isTimeWindow(value: string | undefined): value is TimeWindow {
  return (
    value === "morning" ||
    value === "afternoon" ||
    value === "evening" ||
    value === "anytime"
  )
}
