"use client"

import { useState } from "react"
import type { SiteSpec } from "@/lib/site-spec"
import type { Theme } from "./theme"

type BookingTrack = "barber" | "beauty"

export function BookingPage({
  initialTrack,
  siteVariantId,
  spec,
  theme,
}: {
  initialTrack?: BookingTrack
  siteVariantId?: string
  spec: SiteSpec
  theme: Theme
}) {
  const filteredStaff = initialTrack
    ? spec.staff.filter((member) => member.services.some((service) => matchesTrack(service.category, initialTrack)))
    : spec.staff

  const [selectedStaffId, setSelectedStaffId] = useState(filteredStaff.length === 1 ? filteredStaff[0]?.id ?? "" : "")
  const [selectedService, setSelectedService] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [smsConsent, setSmsConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const staffMember = spec.staff.find((s) => s.id === selectedStaffId)
  const services = (staffMember?.services ?? []).filter((service) => matchesTrack(service.category, initialTrack))
  const bookingTitle = initialTrack ? `Book ${formatTrack(initialTrack)} Services` : "Book an Appointment"
  const selectedServiceOption = services.find((service) => service.id === selectedService)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: spec.shop.id,
          serviceId: selectedService || undefined,
          staffId: selectedStaffId || undefined,
          clientName: name,
          clientPhone: normalizePhoneForApi(phone),
          clientEmail: email || undefined,
          source: siteVariantId ? "site-variant" : "waitlist",
          notes: buildRequestNotes({
            initialTrack,
            selectedServiceName: selectedServiceOption?.name,
            selectedStaffName: staffMember?.name,
            siteVariantId,
            smsConsent,
          }),
          siteVariantId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Something went wrong. Please try again.")
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
        <div className="max-w-md text-center space-y-4">
          <div className="text-4xl">✓</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: theme.displayFont }}>
            Request Received
          </h1>
          <p style={{ opacity: 0.7 }}>
            We&apos;ll confirm your appointment shortly.
            {smsConsent && " You'll receive a text message confirmation."}
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: theme.primaryColor, color: theme.backgroundColor }}
          >
            Back to {spec.shop.name}
          </a>
        </div>
      </div>
    )
  }

  const inputStyle = {
    backgroundColor: `${theme.textColor}08`,
    borderColor: `${theme.textColor}20`,
    color: theme.textColor,
  }

  return (
    <div className="min-h-dvh" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.bodyFont }}>
      {/* Header */}
      <header
        className="border-b px-4 sm:px-6 py-4"
        style={{ borderColor: `${theme.textColor}15` }}
      >
        <a href="/" className="text-xl font-bold" style={{ fontFamily: theme.displayFont, color: theme.primaryColor }}>
          {spec.shop.name}
        </a>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-8"
          style={{ fontFamily: theme.displayFont }}
        >
          {bookingTitle}
        </h1>
        {initialTrack ? (
          <p className="mb-8 text-sm leading-6 text-pretty" style={{ opacity: 0.7 }}>
            Showing {formatTrack(initialTrack).toLowerCase()} providers and services.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Staff selection */}
          <div className="space-y-2">
            <label htmlFor="book-staff" className="block text-sm font-medium" style={{ opacity: 0.8 }}>
              Who would you like to see?
            </label>
            <select
              id="book-staff"
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value)
                setSelectedService("")
              }}
              required
              className="w-full rounded-lg px-3 py-2.5 text-sm border"
              style={inputStyle}
            >
              <option value="">Select a team member</option>
              {filteredStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.role}
                </option>
              ))}
            </select>
          </div>

          {/* Service selection */}
          {selectedStaffId && (
            <div className="space-y-2">
              <label htmlFor="book-service" className="block text-sm font-medium" style={{ opacity: 0.8 }}>
                Service
              </label>
              <select
                id="book-service"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm border"
                style={inputStyle}
              >
                <option value="">Select a service</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} — {svc.durationMinutes}min
                    {svc.priceDisplay ? ` — ${svc.priceDisplay}` : svc.priceCents > 0 ? ` — $${(svc.priceCents / 100).toFixed(0)}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contact info */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-semibold" style={{ fontFamily: theme.displayFont }}>
              Your Information
            </h2>

            <div className="space-y-2">
              <label htmlFor="book-name" className="block text-sm font-medium" style={{ opacity: 0.8 }}>
                Name
              </label>
              <input
                id="book-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
                className="w-full rounded-lg px-3 py-2.5 text-sm border"
                style={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="book-phone" className="block text-sm font-medium" style={{ opacity: 0.8 }}>
                Phone Number
              </label>
              <input
                id="book-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="(555) 123-4567"
                className="w-full rounded-lg px-3 py-2.5 text-sm border"
                style={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="book-email" className="block text-sm font-medium" style={{ opacity: 0.8 }}>
                Email <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                id="book-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg px-3 py-2.5 text-sm border"
                style={inputStyle}
              />
            </div>
          </div>

          {/* SMS Consent checkbox */}
          <div
            className="rounded-lg border p-4 space-y-2"
            style={{ borderColor: `${theme.textColor}20`, backgroundColor: `${theme.textColor}05` }}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded"
                data-testid="sms-consent-checkbox"
              />
              <span className="text-sm leading-relaxed">
                I agree to receive appointment reminders and notifications via
                text message from {spec.shop.name} (powered by Koureia).
                Message and data rates may apply. Reply STOP to opt out at any
                time.
              </span>
            </label>
            <div className="flex gap-3 text-xs ml-7" style={{ opacity: 0.6 }}>
              <a
                href="https://koureia.com/sms-consent"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
                style={{ color: theme.primaryColor }}
              >
                SMS Consent Policy
              </a>
              <a
                href="https://koureia.com/privacy#sms-communications"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
                style={{ color: theme.primaryColor }}
              >
                Privacy Policy
              </a>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: theme.primaryColor, color: theme.backgroundColor }}
          >
            {submitting ? "Sending…" : "Request Appointment"}
          </button>

          <p className="text-xs text-center" style={{ opacity: 0.4 }}>
            This sends a booking request. {spec.shop.name} will confirm your
            appointment time.
          </p>
        </form>
      </main>
    </div>
  )
}

function formatTrack(track: BookingTrack) {
  return track === "barber" ? "Barber" : "Beauty"
}

function matchesTrack(category: string | undefined, track: BookingTrack | undefined) {
  if (!track) return true
  const normalized = category?.toLowerCase() ?? ""
  const isBarber = normalized.includes("barber")
  return track === "barber" ? isBarber : !isBarber
}

function buildRequestNotes({
  initialTrack,
  selectedServiceName,
  selectedStaffName,
  siteVariantId,
  smsConsent,
}: {
  initialTrack?: BookingTrack
  selectedServiceName?: string
  selectedStaffName?: string
  siteVariantId?: string
  smsConsent: boolean
}) {
  const lines = [
    siteVariantId ? `Site variant: ${siteVariantId}` : null,
    initialTrack ? `Entry track: ${initialTrack}` : null,
    selectedStaffName ? `Requested staff: ${selectedStaffName}` : null,
    selectedServiceName ? `Requested service: ${selectedServiceName}` : null,
    smsConsent ? "Client gave SMS consent in the public site form." : null,
  ].filter(Boolean)

  return lines.length > 0 ? lines.join("\n") : undefined
}

function normalizePhoneForApi(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^\+[1-9]\d{1,14}$/.test(trimmed)) return trimmed
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  return trimmed
}
