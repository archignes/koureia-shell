import { defineCatalog } from "@json-render/core"
import { schema } from "@json-render/react/schema"
import { z } from "zod"

export const catalog = defineCatalog(schema, {
  components: {
    SiteNav: {
      props: z.object({
        shopName: z.string(),
        logoUrl: z.string().optional(),
        links: z.array(
          z.object({
            label: z.string(),
            href: z.string(),
          })
        ),
      }),
      description: "Site navigation with optional logo, shop name, and link list",
    },
    Hero: {
      props: z.object({
        headline: z.string(),
        subtitle: z.string(),
        coverImageUrl: z.string().optional(),
        ctaLabel: z.string().optional(),
        ctaHref: z.string().optional(),
      }),
      description: "Hero header with headline, subtitle, optional cover image, and optional CTA",
    },
    StaffGrid: {
      props: z.object({
        staff: z.array(
          z.object({
            name: z.string(),
            role: z.string().optional(),
            photoUrl: z.string().optional(),
            bio: z.string().optional(),
          })
        ),
      }),
      description: "Grid of staff cards with names and optional role, photo, and bio",
    },
    ServiceAccordion: {
      props: z.object({
        categories: z.array(
          z.object({
            name: z.string(),
            services: z.array(
              z.object({
                name: z.string(),
                duration: z.string(),
                price: z.string(),
                description: z.string().optional(),
              })
            ),
          })
        ),
      }),
      description: "Service categories with nested service rows, duration, price, and optional description",
    },
    HoursTable: {
      props: z.object({
        hours: z.array(
          z.object({
            day: z.string(),
            open: z.string(),
            close: z.string(),
            closed: z.boolean().optional(),
          })
        ),
      }),
      description: "Opening hours table with per-day open, close, and optional closed state",
    },
    PolicyBlock: {
      props: z.object({
        title: z.string(),
        body: z.string(),
      }),
      description: "Policy section with a title and supporting body copy",
    },
    BookingCTA: {
      props: z.object({
        label: z.string(),
        href: z.string(),
        variant: z.enum(["sticky", "inline"]),
      }),
      description: "Booking call-to-action rendered as either an inline button or sticky bottom bar",
    },
    RequestHero: {
      props: z.object({
        headline: z.string(),
        subtitle: z.string(),
        shopName: z.string(),
        shopLogoUrl: z.string().optional(),
        staffName: z.string().optional(),
        logoUrl: z.string().optional(),
      }),
      description: "Hero section for booking request pages with shop/staff context",
    },
    ServicePicker: {
      props: z.object({
        services: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            duration: z.string(),
            price: z.string(),
          })
        ),
        preselectedId: z.string().optional(),
      }),
      description: "Radio group for selecting a service, with name/price/duration display",
    },
    StaffPicker: {
      props: z.object({
        staff: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            photoUrl: z.string().optional(),
            role: z.string().optional(),
          })
        ),
        preselectedId: z.string().optional(),
        allowNoPreference: z.boolean().optional(),
      }),
      description: "Avatar radio group for selecting a staff member",
    },
    LinkedEntryNotice: {
      props: z.object({
        label: z.string().optional(),
      }),
      description: "Notice for tokenized waitlist links for known clients",
    },
    PreferenceForm: {
      props: z.object({
        fields: z.array(
          z.enum(["dateRange", "flexibleDates", "timeWindow", "notes", "phone", "name", "email"])
        ),
        optionalFields: z.array(z.enum(["dateRange", "flexibleDates", "timeWindow", "notes", "phone", "name", "email"])).optional(),
        dateRangeLabel: z.string().optional(),
        dateRangePlaceholder: z.string().optional(),
        timeWindowLabel: z.string().optional(),
        notesLabel: z.string().optional(),
        notesPlaceholder: z.string().optional(),
      }),
      description: "Configurable preference capture form -- only renders fields listed in the fields array",
    },
    ServiceMenu: {
      props: z.object({
        primary: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            duration: z.string(),
            price: z.string(),
          })
        ),
        extras: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            duration: z.string(),
            price: z.string(),
          })
        ),
        preselectedId: z.string().optional(),
        sectionLabel: z.string().optional(),
      }),
      description: "Service menu with primary single-select and extras multi-select",
    },
    BookingModeButtons: {
      props: z.object({
        modes: z.array(
          z.object({
            mode: z.enum(["after-hours", "home-service"]),
            label: z.string(),
            description: z.string(),
            price: z.string(),
            serviceId: z.string(),
          })
        ),
      }),
      description: "Special booking mode buttons (after-hours, home service) shown on waitlist",
    },
    SurchargeBanner: {
      props: z.object({
        message: z.string(),
      }),
      description: "Banner displaying after-hours surcharge info",
    },
    AvailabilityPicker: {
      props: z.object({
        apiUrl: z.string().optional(),
        shopSlug: z.string(),
        staffId: z.string().optional(),
        minAdvanceHours: z.number().optional(),
        surchargeCents: z.number().optional(),
        shopTimezone: z.string().optional(),
        mode: z.enum(["regular", "after_hours"]).optional(),
      }),
      description: "Calendar date picker with time slot selection for after-hours booking",
    },
    WaitlistAvailabilityPicker: {
      props: z.object({
        shopHours: z.array(
          z.object({
            dayOfWeek: z.number(),
            startTime: z.string(),
            endTime: z.string(),
            isClosed: z.boolean(),
          })
        ),
        staffHoursById: z.record(
          z.string(),
          z.array(
            z.object({
              dayOfWeek: z.number(),
              startTime: z.string(),
              endTime: z.string(),
              isClosed: z.boolean(),
            }),
          ),
        ),
        horizonDays: z.number().optional(),
        timezone: z.string().optional(),
      }),
      description: "When2meet-style availability grid for public waitlist signups",
    },
    OrderSummary: {
      props: z.object({
        allServices: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            duration: z.string(),
            price: z.string(),
            priceCents: z.number(),
          })
        ),
        surchargeCents: z.number(),
      }),
      description: "Live order summary showing selected services, date/time, and estimated total",
    },
    SubmitButton: {
      props: z.object({
        label: z.string(),
        submittingLabel: z.string().optional(),
        submittingHint: z.string().optional(),
      }),
      description: "Form submit button with loading state",
    },
    ConfirmationMessage: {
      props: z.object({
        headline: z.string(),
        body: z.string(),
        icon: z.enum(["pending"]).optional(),
      }),
      description: "Success message shown after form submission",
    },
    PolicyConfirm: {
      props: z.object({
        message: z.string(),
      }),
      description: "Checkbox for policy/surcharge acknowledgment before booking",
    },
    BookingSuccess: {
      props: z.object({
        serviceName: z.string(),
        date: z.string(),
        time: z.string(),
        holdExpiresAt: z.string().optional(),
      }),
      description: "Success screen after hold creation with appointment details",
    },
    SiteFooter: {
      props: z.object({
        text: z.string(),
        linkText: z.string(),
        linkHref: z.string(),
      }),
      description: "Footer with text and a single link",
    },
    Container: {
      props: z.object({}),
      slots: ["default"],
      description: "Root container that renders children in sequence",
    },
  },
  actions: {},
})
