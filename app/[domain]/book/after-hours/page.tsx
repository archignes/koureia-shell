import type { Metadata } from "next"
import {
  BookingRequestPage,
  type BookingRequestPageProps,
  generateBookingRequestMetadata,
} from "../request-page"

type PageProps = BookingRequestPageProps

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateBookingRequestMetadata({ params, variant: "after-hours" })
}

export default function AfterHoursPage(props: PageProps) {
  return <BookingRequestPage {...props} variant="after-hours" />
}
