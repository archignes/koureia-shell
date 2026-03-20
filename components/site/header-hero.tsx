import type { SiteSpec } from "@/lib/site-spec"

import { ButtonLink } from "./primitives"
import type { Theme } from "./theme"

const NAV_ITEMS = [
  { label: "About", href: "#about" },
  { label: "Team", href: "#team" },
  { label: "Services", href: "#services" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Location", href: "#location" },
]

export function Header({
  shopName,
  bookingUrl,
  theme,
}: {
  shopName: string
  bookingUrl: string
  theme: Theme
}) {
  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur-sm"
      style={{
        borderColor: `${theme.primaryColor}24`,
        backgroundColor: `${theme.backgroundColor}EB`,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <a href="#" className="flex items-center">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt={shopName} className="h-10 w-auto sm:h-12" />
          ) : (
            <span
              className="text-2xl text-balance"
              style={{ color: theme.primaryColor, fontFamily: theme.displayFont }}
            >
              {shopName}
            </span>
          )}
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-pretty transition-opacity hover:opacity-100"
              style={{ color: `${theme.textColor}CC` }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <ButtonLink href={bookingUrl} theme={theme}>
            Book Now
          </ButtonLink>
        </div>

        <details className="group relative md:hidden">
          <summary
            className="flex list-none appearance-none items-center justify-center rounded-full border p-2"
            style={{ borderColor: `${theme.primaryColor}35`, color: theme.primaryColor }}
          >
            <span className="sr-only">Open navigation</span>
            <div className="space-y-1">
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
            </div>
          </summary>
          <div
            className="absolute inset-x-0 top-full border-b px-5 py-4 shadow-lg"
            style={{
              borderColor: `${theme.primaryColor}24`,
              backgroundColor: theme.backgroundColor,
            }}
          >
            <nav className="flex flex-col gap-4">
              {NAV_ITEMS.map((item) => (
                <a key={item.href} href={item.href} className="text-sm" style={{ color: theme.textColor }}>
                  {item.label}
                </a>
              ))}
              <ButtonLink href={bookingUrl} theme={theme} className="mt-2 justify-center">
                Book Now
              </ButtonLink>
            </nav>
          </div>
        </details>
      </div>
    </header>
  )
}

export function HeroSection({
  shop,
  bookingUrl,
  theme,
}: {
  shop: SiteSpec["shop"]
  bookingUrl: string
  theme: Theme
}) {
  return (
    <section
      className="relative overflow-hidden border-b"
      style={{
        borderColor: `${theme.primaryColor}18`,
        backgroundColor: theme.secondaryColor || theme.backgroundColor,
      }}
    >
      {theme.heroImageUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${theme.heroImageUrl})` }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: `${theme.backgroundColor}AD` }} />
        </>
      ) : null}
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:py-32">
        <div className="max-w-3xl">
          <p className="text-sm uppercase" style={{ color: theme.primaryColor }}>
            {shop.name}
          </p>
          <h1
            className="mt-4 text-5xl leading-tight text-balance sm:text-6xl lg:text-7xl"
            style={{ fontFamily: theme.displayFont, color: theme.textColor }}
          >
            {shop.tagline || shop.name}
          </h1>
          {shop.subTagline ? (
            <p className="mt-5 max-w-2xl text-xl text-pretty sm:text-2xl" style={{ color: theme.primaryColor }}>
              {shop.subTagline}
            </p>
          ) : null}
          {shop.description ? (
            <p className="mt-6 max-w-2xl text-base leading-7 text-pretty sm:text-lg" style={{ color: `${theme.textColor}D8` }}>
              {shop.description}
            </p>
          ) : null}
          <div className="mt-10">
            <ButtonLink href={bookingUrl} theme={theme}>
              Book an Appointment
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
