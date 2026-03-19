import type { SiteSpec, SiteStaffMember, SiteHours } from "@/lib/site-spec"
import { dayName, formatTime } from "@/lib/utils"

type Props = { spec: SiteSpec }

export function SiteRenderer({ spec }: Props) {
  const { shop, branding, staff, hours, social } = spec
  const bookUrl = "/book"

  // Collect unique service categories across all staff
  const categories = [
    ...new Set(staff.flatMap((s) => s.services.map((svc) => svc.category ?? "Services"))),
  ]

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: branding.backgroundColor,
        color: branding.textColor,
        fontFamily: `'${branding.bodyFont}', sans-serif`,
      }}
    >
      {/* Header */}
      <header
        className="border-b px-6 py-4"
        style={{ borderColor: `${branding.primaryColor}30` }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={shop.name} className="h-10 w-auto" />
          ) : (
            <span
              className="text-xl font-semibold"
              style={{ color: branding.primaryColor, fontFamily: `'${branding.displayFont}', serif` }}
            >
              {shop.name}
            </span>
          )}
          <a
            href={bookUrl}
            className="rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: branding.primaryColor, color: branding.backgroundColor }}
          >
            Book Now
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className="text-4xl font-bold md:text-5xl lg:text-6xl"
            style={{ color: branding.primaryColor, fontFamily: `'${branding.displayFont}', serif` }}
          >
            {shop.name}
          </h1>
          {shop.tagline && (
            <p className="mt-4 text-lg opacity-70 md:text-xl">{shop.tagline}</p>
          )}
          {shop.description && (
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed opacity-50">
              {shop.description}
            </p>
          )}
          <div className="mt-10">
            <a
              href={bookUrl}
              className="inline-block rounded-md px-8 py-3.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: branding.primaryColor, color: branding.backgroundColor }}
            >
              Book an Appointment
            </a>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      {staff.length > 0 && (
        <section
          className="border-t px-6 py-16"
          style={{ borderColor: `${branding.primaryColor}12` }}
        >
          <div className="mx-auto max-w-5xl">
            <SectionHeading branding={branding}>Meet the Team</SectionHeading>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((member) => (
                <TeamCard key={member.name} member={member} branding={branding} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* What We Offer */}
      {categories.length > 0 && (
        <section
          className="border-t px-6 py-16"
          style={{ borderColor: `${branding.primaryColor}12` }}
        >
          <div className="mx-auto max-w-5xl">
            <SectionHeading branding={branding}>What We Offer</SectionHeading>
            <div className="mt-10 flex flex-wrap gap-3">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border px-5 py-2.5 text-sm"
                  style={{ borderColor: `${branding.primaryColor}30`, color: branding.primaryColor }}
                >
                  {cat}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm opacity-40">
              View full services and pricing when you book.
            </p>
          </div>
        </section>
      )}

      {/* Hours & Location */}
      <section
        className="border-t px-6 py-16"
        style={{ borderColor: `${branding.primaryColor}12` }}
      >
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
          {hours.length > 0 && (
            <div>
              <SectionHeading branding={branding}>Hours</SectionHeading>
              <div className="mt-6 space-y-2">
                {hours.map((h) => (
                  <HoursRow key={h.dayOfWeek} hours={h} branding={branding} />
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionHeading branding={branding}>Find Us</SectionHeading>
            <div className="mt-6 space-y-3 text-sm">
              {shop.address && (
                <p className="opacity-70">{shop.address}</p>
              )}
              {shop.phone && (
                <p>
                  <a href={`tel:${shop.phone}`} className="opacity-70 hover:opacity-100">
                    {shop.phone}
                  </a>
                </p>
              )}
              {shop.email && (
                <p>
                  <a href={`mailto:${shop.email}`} className="opacity-70 hover:opacity-100">
                    {shop.email}
                  </a>
                </p>
              )}
              {social.length > 0 && (
                <div className="flex gap-4 pt-3">
                  {social.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm capitalize opacity-50 hover:opacity-100"
                      style={{ color: branding.primaryColor }}
                    >
                      {link.platform}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="border-t px-6 py-16 text-center"
        style={{ borderColor: `${branding.primaryColor}12` }}
      >
        <p
          className="text-2xl font-bold"
          style={{ color: branding.primaryColor, fontFamily: `'${branding.displayFont}', serif` }}
        >
          Ready to book?
        </p>
        <div className="mt-6">
          <a
            href={bookUrl}
            className="inline-block rounded-md px-8 py-3.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: branding.primaryColor, color: branding.backgroundColor }}
          >
            Book an Appointment
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t px-6 py-6"
        style={{ borderColor: `${branding.primaryColor}10` }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs opacity-40">
          <span>{shop.name}</span>
          <span>Powered by Koureia</span>
        </div>
      </footer>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

type BrandingProp = { branding: SiteSpec["branding"] }

function SectionHeading({ children, branding }: { children: React.ReactNode } & BrandingProp) {
  return (
    <h2
      className="text-2xl font-bold"
      style={{ color: branding.primaryColor, fontFamily: `'${branding.displayFont}', serif` }}
    >
      {children}
    </h2>
  )
}

function TeamCard({ member, branding }: { member: SiteStaffMember } & BrandingProp) {
  const color = member.colorHex ?? branding.primaryColor

  return (
    <div
      className="rounded-xl border p-6"
      style={{ borderColor: `${branding.primaryColor}15` }}
    >
      <div className="flex items-center gap-4">
        {member.imageUrl ? (
          <img
            src={member.imageUrl}
            alt={member.name}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {member.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
        )}
        <div>
          <h3 className="font-semibold" style={{ color }}>{member.name}</h3>
          <p className="text-sm capitalize opacity-50">{member.role}</p>
        </div>
      </div>
      {member.specialties.length > 0 && (
        <p className="mt-3 text-sm opacity-40">
          {member.specialties.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" · ")}
        </p>
      )}
    </div>
  )
}

function HoursRow({ hours, branding }: { hours: SiteHours } & BrandingProp) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="w-28 opacity-70">{dayName(hours.dayOfWeek)}</span>
      {hours.isClosed ? (
        <span className="opacity-30">Closed</span>
      ) : (
        <span style={{ color: branding.primaryColor }}>
          {formatTime(hours.startTime)} – {formatTime(hours.endTime)}
        </span>
      )}
    </div>
  )
}
