"use client"

import { useBoundProp, useStateStore, type Components } from "@json-render/react"
import { AvailabilityPicker } from "@/lib/components/availability-picker"
import { ServiceMenu as ServiceMenuComponent } from "@/lib/components/service-menu"
import { OrderSummary as OrderSummaryComponent } from "@/lib/components/order-summary"
import { PreferenceForm as PreferenceFormComponent } from "@/lib/components/preference-form"

import { catalog } from "../catalog"

type RequestComponentKeys =
  | "RequestHero"
  | "ServicePicker"
  | "ServiceMenu"
  | "StaffPicker"
  | "SurchargeBanner"
  | "AvailabilityPicker"
  | "OrderSummary"
  | "PreferenceForm"
  | "SubmitButton"
  | "ConfirmationMessage"

export const requestComponents: Pick<Components<typeof catalog>, RequestComponentKeys> = {
  RequestHero: ({ props }) => (
    <header className="request-hero">
      <p className="request-hero__context">
        {props.shopName}
        {props.staffName ? <> &middot; {props.staffName}</> : null}
      </p>
      <h1 className="request-hero__headline">{props.headline}</h1>
      <p className="request-hero__subtitle">{props.subtitle}</p>
    </header>
  ),

  ServicePicker: ({ props }) => {
    const [selectedServiceId, setSelectedServiceId] = useBoundProp(
      props.preselectedId,
      "selectedServiceId"
    )

    return (
      <fieldset className="service-picker">
        <legend className="service-picker__legend">Select a service</legend>
        <div className="service-picker__options">
          {props.services.map((service) => {
            const isSelected = selectedServiceId === service.id
            return (
              <label
                key={service.id}
                className={`service-picker__option${isSelected ? " service-picker__option--selected" : ""}`}
                htmlFor={`service-${service.id}`}
              >
                <input
                  checked={isSelected}
                  className="service-picker__radio"
                  id={`service-${service.id}`}
                  name="selectedServiceId"
                  type="radio"
                  onChange={() => setSelectedServiceId(service.id)}
                />
                <span className="service-picker__row">
                  <span className="service-picker__name">{service.name}</span>
                  <span className="service-picker__meta">
                    <span className="service-picker__duration">
                      {service.duration}
                    </span>
                    <span className="service-picker__price">{service.price}</span>
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  },

  ServiceMenu: ({ props }) => (
    <ServiceMenuComponent
      primary={props.primary}
      extras={props.extras}
      preselectedId={props.preselectedId}
      sectionLabel={props.sectionLabel}
    />
  ),

  StaffPicker: ({ props }) => {
    const [selectedStaffId, setSelectedStaffId] = useBoundProp(
      props.preselectedId,
      "selectedStaffId"
    )

    return (
      <fieldset className="staff-picker">
        <legend className="staff-picker__legend">Select a staff member</legend>
        <div className="staff-picker__options">
          {props.staff.map((member) => {
            const isSelected = selectedStaffId === member.id
            return (
              <label
                key={member.id}
                className={`staff-picker__card${isSelected ? " staff-picker__card--selected" : ""}`}
                htmlFor={`staff-${member.id}`}
              >
                <input
                  checked={isSelected}
                  className="staff-picker__radio"
                  id={`staff-${member.id}`}
                  name="selectedStaffId"
                  type="radio"
                  onChange={() => setSelectedStaffId(member.id)}
                />
                {member.photoUrl ? (
                  <img
                    alt={member.name}
                    className="staff-picker__photo"
                    src={member.photoUrl}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="staff-picker__photo staff-picker__photo--placeholder"
                  />
                )}
                <span className="staff-picker__content">
                  <span className="staff-picker__name">{member.name}</span>
                  {member.role ? (
                    <>
                      <span className="staff-picker__sep" aria-hidden="true">&middot;</span>
                      <span className="staff-picker__role">{member.role}</span>
                    </>
                  ) : null}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  },

  PreferenceForm: ({ props }) => (
    <PreferenceFormComponent
      fields={props.fields}
      dateRangeLabel={props.dateRangeLabel}
      timeWindowLabel={props.timeWindowLabel}
      notesPlaceholder={props.notesPlaceholder}
    />
  ),

  SurchargeBanner: ({ props }) => (
    <div className="surcharge-banner">{props.message}</div>
  ),

  AvailabilityPicker: ({ props }) => {
    const { update } = useStateStore()
    return (
      <AvailabilityPicker
        minAdvanceHours={props.minAdvanceHours}
        shopTimezone={props.shopTimezone}
        onSlotSelect={(date, slot) => update({
          preferredDate: date,
          preferredSlotStart: slot.start,
          preferredSlotEnd: slot.end,
        })}
      />
    )
  },

  OrderSummary: ({ props }) => (
    <OrderSummaryComponent
      allServices={props.allServices}
      surchargeCents={props.surchargeCents}
    />
  ),

  SubmitButton: ({ props, emit, loading }) => (
    <div className="submit-section">
      <p className="submit-section__consent">
        By submitting, you agree to receive appointment-related messages via
        text from this shop (powered by Koureia). Message &amp; data rates may
        apply. Reply STOP to opt out.
      </p>
      <div className="submit-section__legal">
        <a href="https://koureia.com/terms" target="_blank" rel="noopener noreferrer">
          Terms of Service
        </a>
        <a href="https://koureia.com/privacy" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>
        <a href="https://koureia.com/sms-consent" target="_blank" rel="noopener noreferrer">
          SMS Policy
        </a>
      </div>
      <button
        className="submit-button"
        disabled={loading}
        type="button"
        onClick={() => emit("submit")}
      >
        {loading ? props.submittingLabel ?? "Sending..." : props.label}
      </button>
    </div>
  ),

  ConfirmationMessage: ({ props }) => (
    <div className="confirmation-message" role="status">
      <div aria-hidden="true" className="confirmation-message__check">
        ✓
      </div>
      <h2 className="confirmation-message__headline">{props.headline}</h2>
      <p className="confirmation-message__body">{props.body}</p>
    </div>
  ),
}
