import type { SiteSpec } from "@/lib/site-spec"

import {
  BrandPhilosophySection,
  FeaturedServiceSection,
  MeetTheTeamSection,
  OriginStorySection,
  ServicesSection,
  TestimonialsSection,
} from "./site/content-sections"
import { Header, HeroSection } from "./site/header-hero"
import {
  BottomCta,
  Footer,
  HoursAndLocationSection,
  PaymentMethodsSection,
  PoliciesSection,
} from "./site/info-sections"
import { getTheme } from "./site/theme"

export function SiteRenderer({ spec }: { spec: SiteSpec }) {
  const { shop, staff, hours, social, testimonials, featuredService } = spec
  const theme = getTheme(spec.branding)
  const bookingUrl = spec.bookingUrl || "/book"
  const categories = [
    ...new Set(staff.flatMap((member) => member.services.map((service) => service.category ?? "Services"))),
  ]

  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.bodyFont,
      }}
    >
      <Header shopName={shop.name} bookingUrl={bookingUrl} theme={theme} />
      <HeroSection shop={shop} bookingUrl={bookingUrl} theme={theme} />
      <BrandPhilosophySection philosophy={shop.brandPhilosophy} theme={theme} />
      <MeetTheTeamSection staff={staff} theme={theme} />
      <FeaturedServiceSection featuredService={featuredService} theme={theme} />
      <ServicesSection categories={categories} bookingUrl={bookingUrl} theme={theme} />
      <TestimonialsSection testimonials={testimonials} theme={theme} />
      <OriginStorySection originStory={shop.originStory} theme={theme} />
      <HoursAndLocationSection shop={shop} hours={hours} social={social} theme={theme} />
      <PoliciesSection shop={shop} theme={theme} />
      <PaymentMethodsSection paymentMethods={shop.paymentMethods} theme={theme} />
      <BottomCta bookingUrl={bookingUrl} theme={theme} />
      <Footer shopName={shop.name} theme={theme} />
    </div>
  )
}
