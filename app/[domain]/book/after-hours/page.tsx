import { BookingRequestPage } from "../request-page"

type PageProps = {
  params: Promise<{ domain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function AfterHoursPage(props: PageProps) {
  return <BookingRequestPage {...props} variant="after-hours" />
}
