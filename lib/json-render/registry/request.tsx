"use client"

import { useStateStore, type Components } from "@json-render/react"
import { AvailabilityPicker } from "@/lib/components/availability-picker"
import { ServicePicker as ServicePickerComponent } from "@/lib/components/service-picker"
import { ServiceMenu as ServiceMenuComponent } from "@/lib/components/service-menu"
import { StaffPicker as StaffPickerComponent } from "@/lib/components/staff-picker"
import { OrderSummary as OrderSummaryComponent } from "@/lib/components/order-summary"
import { PreferenceForm as PreferenceFormComponent } from "@/lib/components/preference-form"
import { WaitlistAvailabilityPicker as WaitlistAvailabilityPickerComponent } from "@/lib/components/waitlist-availability-picker"

import { catalog } from "../catalog"

type RequestComponentKeys =
  | "RequestHero"
  | "ServicePicker"
  | "ServiceMenu"
  | "StaffPicker"
  | "SurchargeBanner"
  | "AvailabilityPicker"
  | "WaitlistAvailabilityPicker"
  | "OrderSummary"
  | "PreferenceForm"
  | "SubmitButton"
  | "ConfirmationMessage"
  | "PolicyConfirm"
  | "BookingSuccess"

export const requestComponents: Pick<Components<typeof catalog>, RequestComponentKeys> = {
  RequestHero: ({ props }) => (
    <header className="m-0 px-0 pb-2">
      <p className="m-0 mb-[0.15rem] text-base font-normal text-[var(--shell-accent)]">
        {props.shopName}
        {props.staffName ? <> &middot; {props.staffName}</> : null}
      </p>
      <h1 className="m-0 text-[1.35rem] leading-[1.15] font-semibold text-[var(--shell-text)] text-balance">
        {props.headline}
      </h1>
      <p className="mt-1 mr-0 mb-0 ml-0 text-[0.85rem] leading-[1.5] text-[var(--shell-text-muted)] text-pretty">
        {props.subtitle}
      </p>
    </header>
  ),

  ServicePicker: ({ props }) => (
    <ServicePickerComponent services={props.services} preselectedId={props.preselectedId} />
  ),

  ServiceMenu: ({ props }) => (
    <ServiceMenuComponent
      primary={props.primary}
      extras={props.extras}
      preselectedId={props.preselectedId}
      sectionLabel={props.sectionLabel}
    />
  ),

  StaffPicker: ({ props }) => (
    <StaffPickerComponent staff={props.staff} preselectedId={props.preselectedId} allowNoPreference={props.allowNoPreference} />
  ),

  PreferenceForm: ({ props }) => {
    const { state } = useStateStore()
    const typedState = state as Record<string, unknown>
    // In after-hours flow (has surchargeCents), gate behind slot selection
    if (typedState.surchargeCents && !typedState.preferredSlotStart) return null
    return (
      <PreferenceFormComponent
        fields={props.fields}
        dateRangeLabel={props.dateRangeLabel}
        dateRangePlaceholder={props.dateRangePlaceholder}
        timeWindowLabel={props.timeWindowLabel}
        notesLabel={props.notesLabel}
        notesPlaceholder={props.notesPlaceholder}
      />
    )
  },

  SurchargeBanner: ({ props }) => (
    <div className="mt-2 px-[0.85rem] py-[0.6rem] border-l-[3px] border-l-[var(--shell-accent)] bg-[rgba(199,164,106,0.1)] text-left text-[0.9rem] font-semibold text-[var(--shell-accent)]">
      {props.message}
    </div>
  ),

  AvailabilityPicker: ({ props }) => {
    const { update, state } = useStateStore()
    const typedState = state as { selectedStaffId?: string; selectedServiceId?: string }
    const staffId = typedState.selectedStaffId ?? props.staffId
    const serviceId = typedState.selectedServiceId

    if (!serviceId) {
      return (
        <p className="mt-4 px-0 py-4 text-center text-[0.8rem] text-[var(--shell-text-muted)]">
          Select a service to see available times
        </p>
      )
    }

    return (
      <AvailabilityPicker
        apiUrl={props.apiUrl}
        shopSlug={props.shopSlug}
        serviceId={serviceId}
        staffId={staffId}
        minAdvanceHours={props.minAdvanceHours}
        shopTimezone={props.shopTimezone}
        onSlotSelect={(date, slot) => update({
          preferredDate: date,
          preferredSlotStart: slot.start,
          preferredSlotEnd: slot.end,
          preferredStartsAt: slot.startsAt,
        })}
      />
    )
  },

  WaitlistAvailabilityPicker: ({ props }) => {
    const { update, state } = useStateStore()
    const typedState = state as { selectedStaffId?: string }
    const hours =
      typedState.selectedStaffId && props.staffHoursById?.[typedState.selectedStaffId]
        ? props.staffHoursById[typedState.selectedStaffId]
        : props.shopHours

    return (
      <WaitlistAvailabilityPickerComponent
        hours={hours ?? []}
        horizonDays={props.horizonDays}
        timezone={props.timezone}
        onChange={(availabilityBlocks) => update({ availabilityBlocks })}
      />
    )
  },

  OrderSummary: ({ props }) => {
    const { state } = useStateStore()
    if (!(state as Record<string, unknown>).preferredSlotStart) return null
    return (
      <OrderSummaryComponent
        allServices={props.allServices}
        surchargeCents={props.surchargeCents}
      />
    )
  },

  SubmitButton: ({ props, emit, loading }) => {
    const { state } = useStateStore()
    const typedState = state as Record<string, unknown>
    // In after-hours flow, gate behind slot selection
    if (typedState.surchargeCents && !typedState.preferredSlotStart) return null
    const submitError = typedState.submitError as string | undefined
    return (
    <div className="mt-4">
      {submitError ? (
        <div
          className="mb-3 rounded-lg border border-red-900/30 bg-red-950/40 px-4 py-3 text-[0.85rem] text-red-300"
          role="alert"
        >
          {submitError}
        </div>
      ) : null}
      <p className="mb-2 text-[0.75rem] leading-[1.5] text-[var(--shell-text-subtle)] text-pretty">
        By submitting, you agree to receive appointment-related messages via
        text from this shop (powered by Koureia). Message &amp; data rates may
        apply. Reply STOP to opt out.
      </p>
      <div className="mb-3 flex gap-3">
        <a
          className="text-[0.7rem] text-[var(--shell-text-muted)] underline underline-offset-[2px] hover:text-[var(--shell-accent)]"
          href="https://koureia.com/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Service
        </a>
        <a
          className="text-[0.7rem] text-[var(--shell-text-muted)] underline underline-offset-[2px] hover:text-[var(--shell-accent)]"
          href="https://koureia.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        <a
          className="text-[0.7rem] text-[var(--shell-text-muted)] underline underline-offset-[2px] hover:text-[var(--shell-accent)]"
          href="https://koureia.com/sms-consent"
          target="_blank"
          rel="noopener noreferrer"
        >
          SMS Policy
        </a>
      </div>
      <button
        className="mb-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-0 bg-[var(--shell-accent)] px-5 py-[0.65rem] text-[0.9rem] font-bold text-[var(--shell-accent-contrast)] shadow-[0_12px_28px_rgba(199,164,106,0.15)] transition-[transform,background-color,box-shadow] hover:-translate-y-px hover:bg-[var(--shell-accent-strong)] disabled:cursor-wait disabled:bg-[var(--shell-accent-strong)] disabled:opacity-100"
        disabled={loading}
        type="button"
        onClick={() => emit("submit")}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="inline-block size-4 animate-spin rounded-full border-2 border-[rgba(17,18,24,0.25)] border-t-[var(--shell-accent-contrast)]"
          />
        ) : null}
        {loading ? props.submittingLabel ?? "Sending..." : props.label}
      </button>
      {loading && props.submittingHint ? (
        <p className="mb-2 text-center text-[0.78rem] font-medium text-[var(--shell-accent)]">
          {props.submittingHint}
        </p>
      ) : null}
    </div>
    )
  },

  ConfirmationMessage: ({ props }) => (
    <div
      className="m-0 rounded-[2rem] border border-[var(--shell-border)] bg-[rgba(228,231,239,0.04)] px-6 py-8 text-center"
      role="status"
    >
      <div
        aria-hidden="true"
        className="inline-flex size-14 items-center justify-center rounded-full bg-[rgba(199,164,106,0.14)] text-[1.8rem] text-[var(--shell-accent)]"
      >
        ✓
      </div>
      <h2 className="mt-4 text-[1.8rem] leading-[1.15] text-[var(--shell-text)] text-balance">
        {props.headline}
      </h2>
      <p className="mx-auto mt-[0.85rem] max-w-[34rem] text-[var(--shell-text-muted)] text-pretty">
        {props.body}
      </p>
    </div>
  ),

  PolicyConfirm: ({ props }) => {
    const { state, set } = useStateStore()
    const typedState = state as Record<string, unknown>
    if (!typedState.preferredSlotStart) return null
    const accepted = typedState.policyAccepted as boolean | undefined
    return (
      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--shell-border)] bg-[rgba(228,231,239,0.02)] px-3 py-3">
        <input
          type="checkbox"
          checked={accepted ?? false}
          onChange={(e) => set("policyAccepted", e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--shell-accent)]"
        />
        <span className="text-[0.8rem] leading-[1.5] text-[var(--shell-text-muted)]">
          {props.message}
        </span>
      </label>
    )
  },

  BookingSuccess: ({ props }) => (
    <div
      className="m-0 rounded-[2rem] border border-[var(--shell-border)] bg-[rgba(228,231,239,0.04)] px-6 py-8 text-center"
      role="status"
    >
      <div
        aria-hidden="true"
        className="inline-flex size-14 items-center justify-center rounded-full bg-[rgba(199,164,106,0.14)] text-[1.8rem] text-[var(--shell-accent)]"
      >
        ✓
      </div>
      <h2 className="mt-4 text-[1.8rem] leading-[1.15] text-[var(--shell-text)] text-balance">
        Your time is being held
      </h2>
      <div className="mx-auto mt-3 max-w-[28rem] rounded-xl border border-[rgba(199,164,106,0.15)] bg-[rgba(199,164,106,0.04)] px-4 py-3">
        <p className="text-[0.95rem] font-medium text-[var(--shell-text)]">
          {props.serviceName}
        </p>
        <p className="mt-1 text-[0.85rem] text-[var(--shell-text-muted)]">
          {props.date} at {props.time}
        </p>
      </div>
      <p className="mx-auto mt-4 max-w-[28rem] text-[0.85rem] leading-[1.6] text-[var(--shell-text-muted)] text-pretty">
        We&apos;ve held this slot for you. You&apos;ll receive a confirmation
        text shortly once your booking is approved.
      </p>
    </div>
  ),
}
