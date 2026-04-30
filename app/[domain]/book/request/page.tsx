import type { Metadata } from "next"
import { createElement } from "react"
import {
  BookingRequestPage,
  type BookingRequestPageProps,
  generateBookingRequestMetadata,
} from "../request-page"

type PageProps = BookingRequestPageProps

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateBookingRequestMetadata({ params, variant: "request" })
}

export default function RequestPage(props: PageProps) {
  return createElement(BookingRequestPage, { ...props, variant: "request" })
}
