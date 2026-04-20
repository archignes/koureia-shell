import { notFound } from "next/navigation"

type HoldDetails = {
  id: string
  staff_name: string
  service_name: string
  starts_at: string
  status: "pending" | "confirmed" | "declined" | "expired"
  shop_timezone: string
}

type Props = {
  params: Promise<{ domain: string; holdId: string }>
}

async function fetchHold(holdId: string): Promise<HoldDetails | null> {
  const apiUrl = process.env.KOUREIA_API_URL ?? "https://koureia.com"
  try {
    const res = await fetch(`${apiUrl}/api/booking/holds/${holdId}`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.hold ?? null
  } catch {
    return null
  }
}

function formatDateTime(utcIso: string, timezone: string): string {
  try {
    const date = new Date(utcIso)
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone || undefined,
    })
  } catch {
    return utcIso
  }
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending Confirmation",
    color: "text-amber-400",
    bg: "bg-amber-950/30 border-amber-900/40",
    description: "Your request has been sent to the shop. You'll receive a text when it's confirmed.",
  },
  confirmed: {
    label: "Confirmed",
    color: "text-emerald-400",
    bg: "bg-emerald-950/30 border-emerald-900/40",
    description: "Your appointment is confirmed. See you then!",
  },
  declined: {
    label: "Declined",
    color: "text-red-400",
    bg: "bg-red-950/30 border-red-900/40",
    description: "Unfortunately this time slot is no longer available. Please try booking again.",
  },
  expired: {
    label: "Expired",
    color: "text-zinc-400",
    bg: "bg-zinc-900/30 border-zinc-800/40",
    description: "This hold has expired. Please book a new appointment.",
  },
} as const

export default async function HoldStatusPage({ params }: Props) {
  const { holdId } = await params
  const hold = await fetchHold(holdId)

  if (!hold) {
    notFound()
  }

  const status = STATUS_CONFIG[hold.status] ?? STATUS_CONFIG.pending

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
      <div className="flex-1">
        <h1 className="text-[1.4rem] font-bold text-[var(--shell-text)]">
          Booking Status
        </h1>

        <div className={`mt-5 rounded-xl border p-4 ${status.bg}`}>
          <p className={`text-[0.9rem] font-semibold ${status.color}`}>
            {status.label}
          </p>
          <p className="mt-1 text-[0.8rem] text-[var(--shell-text-muted)]">
            {status.description}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <DetailRow label="Service" value={hold.service_name} />
          <DetailRow label="With" value={hold.staff_name} />
          <DetailRow
            label="When"
            value={formatDateTime(hold.starts_at, hold.shop_timezone)}
          />
        </div>
      </div>

      <p className="mt-8 text-center text-[0.7rem] text-[var(--shell-text-subtle)]">
        Powered by Koureia
      </p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--shell-border)] pb-2">
      <span className="text-[0.8rem] text-[var(--shell-text-muted)]">{label}</span>
      <span className="text-[0.9rem] font-medium text-[var(--shell-text)]">{value}</span>
    </div>
  )
}
