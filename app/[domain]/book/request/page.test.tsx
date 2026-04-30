import { describe, expect, it, vi } from "vitest"

vi.mock("../request-page", () => ({
  BookingRequestPage: vi.fn(() => null),
  generateBookingRequestMetadata: vi.fn(async () => ({
    title: "Request an Appointment | Test Shop",
  })),
}))

describe("/[domain]/book/request page", () => {
  it("renders the shared booking request page with the regular request variant", async () => {
    const [{ default: RequestPage }, { BookingRequestPage }] = await Promise.all([
      import("./page"),
      import("../request-page"),
    ])
    const props = {
      params: Promise.resolve({ domain: "beautyandthebarber.koureia.com" }),
      searchParams: Promise.resolve({}),
    }

    const element = RequestPage(props) as { type: unknown; props: Record<string, unknown> }

    expect(element.type).toBe(BookingRequestPage)
    expect(element.props).toMatchObject({
      ...props,
      variant: "request",
    })
  })

  it("generates regular request metadata", async () => {
    const [{ generateMetadata }, { generateBookingRequestMetadata }] = await Promise.all([
      import("./page"),
      import("../request-page"),
    ])
    const params = Promise.resolve({ domain: "beautyandthebarber.koureia.com" })

    await generateMetadata({ params, searchParams: Promise.resolve({}) })

    expect(generateBookingRequestMetadata).toHaveBeenCalledWith({
      params,
      variant: "request",
    })
  })
})
