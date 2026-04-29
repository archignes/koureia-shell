/**
 * Public KO -> KS contracts.
 *
 * KO owns generating customer-facing links. KS owns serving those links on
 * tenant domains. Add a contract example here whenever KO starts emitting a new
 * customer-facing shell URL.
 */
export const KO_KS_PUBLIC_CONTRACT = {
  intake: {
    tenantDomain: "beautyandthebarber.koureia.com",
    shopSlug: "beauty-and-the-barber",
    generatedPaths: [
      "/intake/barber",
      "/intake/new-client-cassie",
      "/intake/new-client-enzo",
    ],
    legacySupportedPaths: [
      "/intake/beauty-and-the-barber/barber",
      "/intake/beauty-and-the-barber/new-client-cassie",
      "/intake/beauty-and-the-barber/new-client-enzo",
    ],
  },
  bookingReadProxyPaths: [
    "/api/booking/availability",
  ],
  bookingWriteProxyPaths: [
    "/api/booking/waitlist",
    "/api/booking/request",
    "/api/booking/holds",
  ],
  intakeProxyPaths: [
    "/api/intake/submissions",
  ],
} as const
