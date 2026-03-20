import type { ReactNode } from "react"

import type { SiteHours, SiteStaffMember } from "@/lib/site-spec"
import { cn, dayName, formatTime } from "@/lib/utils"

import type { Theme } from "./theme"

export function SectionHeading({ children, theme }: { children: ReactNode; theme: Theme }) {
  return (
    <h2 className="text-3xl text-balance sm:text-4xl" style={{ color: theme.primaryColor, fontFamily: theme.displayFont }}>
      {children}
    </h2>
  )
}

export function ButtonLink({
  href,
  theme,
  className,
  children,
}: {
  href: string
  theme: Theme
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center rounded-full px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90",
        className,
      )}
      style={{
        backgroundColor: theme.primaryColor,
        color: theme.backgroundColor,
      }}
    >
      {children}
    </a>
  )
}

export function InfoItem({
  label,
  children,
  theme,
}: {
  label: string
  children: ReactNode
  theme: Theme
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${theme.primaryColor}12`, backgroundColor: `${theme.textColor}04` }}>
      <p className="text-xs uppercase" style={{ color: theme.primaryColor }}>
        {label}
      </p>
      <div className="mt-2 text-pretty" style={{ color: `${theme.textColor}B8` }}>
        {children}
      </div>
    </div>
  )
}

export function TeamCard({ member, theme }: { member: SiteStaffMember; theme: Theme }) {
  const accent = member.colorHex || theme.primaryColor
  const initials = member.name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <article
      className="rounded-[1.75rem] border p-5"
      style={{
        borderColor: `${theme.primaryColor}18`,
        backgroundColor: `${theme.textColor}06`,
      }}
    >
      <div className="flex items-center gap-4">
        {member.imageUrl ? (
          <img src={member.imageUrl} alt={member.name} className="size-16 rounded-full object-cover" />
        ) : (
          <div
            className="flex size-16 items-center justify-center rounded-full text-lg font-semibold"
            style={{ backgroundColor: `${accent}20`, color: accent }}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-lg text-balance" style={{ color: theme.textColor }}>
            {member.name}
          </h3>
          <p className="text-sm" style={{ color: `${theme.textColor}A8` }}>
            {member.role}
          </p>
        </div>
      </div>
      {member.specialties.length > 0 ? (
        <p className="mt-5 text-sm leading-6 text-pretty" style={{ color: accent }}>
          {member.specialties.join(" · ")}
        </p>
      ) : null}
    </article>
  )
}

export function HoursRow({ hours, theme }: { hours: SiteHours; theme: Theme }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3 text-sm sm:text-base" style={{ borderColor: `${theme.primaryColor}10` }}>
      <span className="tabular-nums" style={{ color: `${theme.textColor}C8` }}>
        {dayName(hours.dayOfWeek)}
      </span>
      <span className="tabular-nums" style={{ color: hours.isClosed ? `${theme.textColor}78` : theme.primaryColor }}>
        {hours.isClosed ? "Closed" : `${formatTime(hours.startTime)} - ${formatTime(hours.endTime)}`}
      </span>
    </div>
  )
}
