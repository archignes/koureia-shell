"use client"

import { useBoundProp, useStateStore, type Components } from "@json-render/react"
import { AvailabilityPicker } from "@/lib/components/availability-picker"
import { ServiceMenu as ServiceMenuComponent } from "@/lib/components/service-menu"

import { catalog } from "../catalog"

type RequestComponentKeys =
  | "RequestHero"
  | "ServicePicker"
  | "ServiceMenu"
  | "StaffPicker"
  | "SurchargeBanner"
  | "AvailabilityPicker"
  | "PreferenceForm"
  | "SubmitButton"
  | "ConfirmationMessage"

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

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

  PreferenceForm: ({ props }) => {
    const [dateRange, setDateRange] = useBoundProp<string | undefined>(
      undefined,
      "dateRange"
    )
    const [timeWindow, setTimeWindow] = useBoundProp<string | undefined>(
      undefined,
      "timeWindow"
    )
    const [notes, setNotes] = useBoundProp<string | undefined>(undefined, "notes")
    const [phone, setPhone] = useBoundProp<string | undefined>(undefined, "phone")
    const [name, setName] = useBoundProp<string | undefined>(undefined, "name")
    const [email, setEmail] = useBoundProp<string | undefined>(undefined, "email")

    const minDate = formatDateInputValue(new Date())
    const maxDateValue = new Date()
    maxDateValue.setDate(maxDateValue.getDate() + 14)
    const maxDate = formatDateInputValue(maxDateValue)

    const fieldRenderers: Record<string, () => React.ReactNode> = {
      name: () => (
        <label className="preference-form__field" htmlFor="preference-name" key="name">
          <span className="preference-form__label">Name</span>
          <input
            autoComplete="name"
            className="preference-form__input"
            id="preference-name"
            type="text"
            value={name ?? ""}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      ),
      phone: () => (
        <label className="preference-form__field" htmlFor="preference-phone" key="phone">
          <span className="preference-form__label">Phone</span>
          <input
            autoComplete="tel"
            className="preference-form__input"
            id="preference-phone"
            type="tel"
            value={phone ?? ""}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
      ),
      email: () => (
        <label className="preference-form__field" htmlFor="preference-email" key="email">
          <span className="preference-form__label">Email</span>
          <input
            autoComplete="email"
            className="preference-form__input"
            id="preference-email"
            type="email"
            value={email ?? ""}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
      ),
      dateRange: () => (
        <label className="preference-form__field" htmlFor="preference-date-range" key="dateRange">
          <span className="preference-form__label">
            {props.dateRangeLabel ?? "Preferred date"}
          </span>
          <input
            className="preference-form__input"
            id="preference-date-range"
            max={maxDate}
            min={minDate}
            type="date"
            value={dateRange ?? ""}
            onChange={(event) => setDateRange(event.target.value)}
          />
        </label>
      ),
      timeWindow: () => (
        <label className="preference-form__field" htmlFor="preference-time-window" key="timeWindow">
          <span className="preference-form__label">
            {props.timeWindowLabel ?? "Preferred time window"}
          </span>
          <select
            className="preference-form__select"
            id="preference-time-window"
            value={timeWindow ?? ""}
            onChange={(event) => setTimeWindow(event.target.value)}
          >
            <option value="">Select a time window</option>
            <option value="morning">Morning (before noon)</option>
            <option value="afternoon">Afternoon (noon-5pm)</option>
            <option value="evening">Evening (after 5pm)</option>
            <option value="anytime">Anytime</option>
          </select>
        </label>
      ),
      notes: () => (
        <label className="preference-form__field" htmlFor="preference-notes" key="notes">
          <span className="preference-form__label">Notes</span>
          <textarea
            className="preference-form__textarea"
            id="preference-notes"
            placeholder={props.notesPlaceholder ?? "Anything we should know?"}
            rows={3}
            value={notes ?? ""}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      ),
    }

    return (
      <div className="preference-form">
        {props.fields.map((field) => fieldRenderers[field]?.())}
      </div>
    )
  },

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

  SubmitButton: ({ props, emit, loading }) => (
    <button
      className="submit-button"
      disabled={loading}
      type="button"
      onClick={() => emit("submit")}
    >
      {loading ? props.submittingLabel ?? "Sending..." : props.label}
    </button>
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
