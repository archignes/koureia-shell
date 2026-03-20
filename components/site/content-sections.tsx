import type { SiteSpec, SiteStaffMember } from "@/lib/site-spec"

import { SectionHeading, TeamCard } from "./primitives"
import type { Theme } from "./theme"

export function BrandPhilosophySection({ philosophy, theme }: { philosophy?: string; theme: Theme }) {
  if (!philosophy) return null

  return (
    <section id="about" className="border-b px-5 py-20 text-center sm:px-6 sm:py-24" style={{ borderColor: `${theme.primaryColor}14` }}>
      <div className="mx-auto max-w-4xl">
        <SectionHeading theme={theme}>Brand Philosophy</SectionHeading>
        <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-pretty sm:text-xl" style={{ color: `${theme.textColor}D8` }}>
          {philosophy}
        </p>
      </div>
    </section>
  )
}

export function MeetTheTeamSection({ staff, theme }: { staff: SiteStaffMember[]; theme: Theme }) {
  if (staff.length === 0) return null

  return (
    <section id="team" className="border-b px-5 py-20 sm:px-6" style={{ borderColor: `${theme.primaryColor}14` }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading theme={theme}>Meet the Team</SectionHeading>
        <p className="mt-3 max-w-2xl text-sm text-pretty sm:text-base" style={{ color: `${theme.textColor}B8` }}>
          Skilled artists, thoughtful service, and a point of view that shapes the whole experience.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <TeamCard key={member.name} member={member} theme={theme} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function FeaturedServiceSection({
  featuredService,
  theme,
}: {
  featuredService?: SiteSpec["featuredService"]
  theme: Theme
}) {
  if (!featuredService) return null

  return (
    <section className="border-b px-5 py-20 sm:px-6" style={{ borderColor: `${theme.primaryColor}14` }}>
      <div
        className="mx-auto max-w-6xl rounded-[2rem] border px-6 py-10 sm:px-10 sm:py-12"
        style={{
          borderColor: `${theme.primaryColor}25`,
          backgroundColor: `${theme.primaryColor}12`,
        }}
      >
        <p className="text-sm uppercase" style={{ color: theme.primaryColor }}>
          Featured Service
        </p>
        <h2 className="mt-4 max-w-3xl text-4xl text-balance sm:text-5xl" style={{ fontFamily: theme.displayFont }}>
          {featuredService.headline}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-pretty sm:text-lg" style={{ color: `${theme.textColor}D8` }}>
          {featuredService.description}
        </p>
        <a
          href="/book"
          className="mt-8 inline-flex items-center rounded-full border px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90"
          style={{ borderColor: `${theme.primaryColor}45`, color: theme.primaryColor }}
        >
          Learn More
        </a>
      </div>
    </section>
  )
}

export function ServicesSection({
  categories,
  bookingUrl,
  theme,
}: {
  categories: string[]
  bookingUrl: string
  theme: Theme
}) {
  if (categories.length === 0) return null

  return (
    <section id="services" className="border-b px-5 py-20 sm:px-6" style={{ borderColor: `${theme.primaryColor}14` }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading theme={theme}>What We Offer</SectionHeading>
        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map((category) => (
            <span
              key={category}
              className="rounded-full border px-4 py-2 text-sm"
              style={{
                borderColor: `${theme.primaryColor}30`,
                color: theme.primaryColor,
                backgroundColor: `${theme.primaryColor}10`,
              }}
            >
              {category}
            </span>
          ))}
        </div>
        <p className="mt-6 text-sm text-pretty" style={{ color: `${theme.textColor}A8` }}>
          View full services and pricing when you book.
        </p>
        <a href={bookingUrl} className="mt-3 inline-block text-sm underline underline-offset-4" style={{ color: theme.primaryColor }}>
          Browse the booking flow
        </a>
      </div>
    </section>
  )
}

export function TestimonialsSection({
  testimonials,
  theme,
}: {
  testimonials: SiteSpec["testimonials"]
  theme: Theme
}) {
  if (testimonials.length === 0) return null

  return (
    <section id="testimonials" className="border-b px-5 py-20 sm:px-6" style={{ borderColor: `${theme.primaryColor}14` }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading theme={theme}>Testimonials</SectionHeading>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {testimonials.slice(0, 4).map((testimonial) => (
            <article
              key={`${testimonial.name}-${testimonial.text.slice(0, 24)}`}
              className="flex h-full flex-col rounded-[1.5rem] border px-5 py-6"
              style={{
                borderColor: `${theme.primaryColor}18`,
                backgroundColor: `${theme.textColor}08`,
              }}
            >
              <span className="text-4xl leading-none" style={{ color: `${theme.primaryColor}85`, fontFamily: theme.displayFont }}>
                &ldquo;
              </span>
              <p className="mt-4 flex-1 text-base italic leading-7 text-pretty" style={{ color: `${theme.textColor}D8` }}>
                {testimonial.text}
              </p>
              <p className="mt-6 text-sm" style={{ color: theme.primaryColor }}>
                {testimonial.name}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function OriginStorySection({ originStory, theme }: { originStory?: string; theme: Theme }) {
  if (!originStory) return null

  const paragraphs = originStory
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <section className="border-b px-5 py-20 sm:px-6" style={{ borderColor: `${theme.primaryColor}14` }}>
      <div className="mx-auto max-w-3xl">
        <SectionHeading theme={theme}>Our Story</SectionHeading>
        <div className="mt-8 space-y-6">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-base leading-8 text-pretty sm:text-lg" style={{ color: `${theme.textColor}D8` }}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
