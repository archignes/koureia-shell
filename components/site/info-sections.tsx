import type { SiteHours, SiteSocialLink, SiteSpec } from "@/lib/site-spec"
import { formatLabel } from "@/lib/utils"

import { ButtonLink, HoursRow, InfoItem, SectionHeading } from "./primitives"
import type { Theme } from "./theme"
import { getMapsUrl } from "./theme"

export function HoursAndLocationSection({
  shop,
  hours,
  social,
  theme,
}: {
  shop: SiteSpec["shop"]
  hours: SiteHours[]
  social: SiteSocialLink[]
  theme: Theme
}) {
  const mapsUrl = getMapsUrl(shop)

  return (
    <section id="location" className="border-b px-5 py-20 sm:px-6" style={{ borderColor: `${theme.primaryColor}14` }}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div>
          <SectionHeading theme={theme}>Hours</SectionHeading>
          <div className="mt-8 space-y-4">
            {hours.map((entry) => (
              <HoursRow key={entry.dayOfWeek} hours={entry} theme={theme} />
            ))}
          </div>
        </div>

        <div>
          <SectionHeading theme={theme}>Location</SectionHeading>
          <div className="mt-8 rounded-[1.5rem] border p-6" style={{ borderColor: `${theme.primaryColor}18`, backgroundColor: `${theme.textColor}06` }}>
            <div className="space-y-3 text-sm sm:text-base">
              {shop.address ? <p className="text-pretty">{shop.address}</p> : null}
              {shop.phone ? (
                <p>
                  <a href={`tel:${shop.phone}`} className="underline underline-offset-4" style={{ color: theme.primaryColor }}>
                    {shop.phone}
                  </a>
                </p>
              ) : null}
              {shop.email ? (
                <p>
                  <a href={`mailto:${shop.email}`} className="underline underline-offset-4" style={{ color: theme.primaryColor }}>
                    {shop.email}
                  </a>
                </p>
              ) : null}
            </div>

            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 block rounded-[1.25rem] border p-5 transition-opacity hover:opacity-90"
                style={{
                  borderColor: `${theme.primaryColor}20`,
                  backgroundColor: `${theme.primaryColor}10`,
                }}
              >
                <p className="text-sm uppercase" style={{ color: theme.primaryColor }}>
                  Google Maps
                </p>
                <p className="mt-2 text-base text-pretty" style={{ color: `${theme.textColor}D8` }}>
                  Open directions for this location
                </p>
                {shop.mapCoordinates ? (
                  <p className="mt-3 text-xs tabular-nums" style={{ color: `${theme.textColor}A8` }}>
                    {shop.mapCoordinates.lat.toFixed(5)}, {shop.mapCoordinates.lng.toFixed(5)}
                  </p>
                ) : null}
              </a>
            ) : null}

            {social.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {social.map((link) => (
                  <a
                    key={`${link.platform}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border px-3 py-1.5 text-sm"
                    style={{ borderColor: `${theme.primaryColor}22`, color: theme.primaryColor }}
                  >
                    {formatLabel(link.platform)}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

export function PoliciesSection({
  shop,
  theme,
}: {
  shop: SiteSpec["shop"]
  theme: Theme
}) {
  const hasPolicies =
    Boolean(shop.cancellationPolicy) ||
    Boolean(shop.birthdayPromo) ||
    Boolean(shop.giftCardUrl) ||
    Boolean(shop.googleReviewsUrl)

  if (!hasPolicies) return null

  return (
    <section className="border-b px-5 py-12 sm:px-6" style={{ borderColor: `${theme.primaryColor}14` }}>
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase" style={{ color: theme.primaryColor }}>
          Policies & Info
        </p>
        <div className="mt-4 grid gap-4 text-sm leading-6 lg:grid-cols-2">
          {shop.cancellationPolicy ? (
            <InfoItem label="Cancellation policy" theme={theme}>
              {shop.cancellationPolicy}
            </InfoItem>
          ) : null}
          {shop.birthdayPromo ? (
            <InfoItem label="Birthday promotion" theme={theme}>
              {shop.birthdayPromo}
            </InfoItem>
          ) : null}
          {shop.giftCardUrl ? (
            <InfoItem label="Gift cards" theme={theme}>
              <a href={shop.giftCardUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4" style={{ color: theme.primaryColor }}>
                Purchase a Gift Card
              </a>
            </InfoItem>
          ) : null}
          {shop.googleReviewsUrl ? (
            <InfoItem label="Google reviews" theme={theme}>
              <a href={shop.googleReviewsUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4" style={{ color: theme.primaryColor }}>
                Leave us a Review
              </a>
            </InfoItem>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function PaymentMethodsSection({
  paymentMethods,
  theme,
}: {
  paymentMethods: string[]
  theme: Theme
}) {
  if (paymentMethods.length === 0) return null

  return (
    <section className="border-b px-5 py-10 sm:px-6" style={{ borderColor: `${theme.primaryColor}14` }}>
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase" style={{ color: theme.primaryColor }}>
          Payment Methods
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {paymentMethods.map((method) => (
            <span
              key={method}
              className="rounded-full border px-3 py-1.5 text-xs uppercase"
              style={{
                borderColor: `${theme.primaryColor}20`,
                color: `${theme.textColor}CC`,
                backgroundColor: `${theme.textColor}06`,
              }}
            >
              {formatPaymentMethod(method)}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BottomCta({ bookingUrl, theme }: { bookingUrl: string; theme: Theme }) {
  return (
    <section className="px-5 py-20 text-center sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-4xl text-balance sm:text-5xl" style={{ fontFamily: theme.displayFont }}>
          Ready to book?
        </h2>
        <div className="mt-8">
          <ButtonLink href={bookingUrl} theme={theme}>
            Book an Appointment
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

export function Footer({ shopName, theme }: { shopName: string; theme: Theme }) {
  return (
    <footer className="border-t px-5 py-6 sm:px-6" style={{ borderColor: `${theme.primaryColor}14` }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ color: `${theme.textColor}90` }}>
        <span>{shopName}</span>
        <span>Powered by Koureia</span>
      </div>
    </footer>
  )
}

function formatPaymentMethod(method: string) {
  const normalized = method.toLowerCase()
  switch (normalized) {
    case "apple_pay":
      return "Apple Pay"
    case "google_pay":
      return "Google Pay"
    case "amex":
      return "AmEx"
    default:
      return formatLabel(normalized)
  }
}
