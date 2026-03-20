import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function dayName(dayOfWeek: number): string {
  if (dayOfWeek < 0 || dayOfWeek > 6 || !Number.isInteger(dayOfWeek)) return ""
  return DAY_NAMES[dayOfWeek]
}

export function formatTime(time: string): string {
  const parts = time.split(":")
  if (parts.length !== 2) return time
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return time
  const suffix = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${m.toString().padStart(2, "0")} ${suffix}`
}

export function formatPrice(priceCents: number, priceDisplay?: string): string {
  if (priceDisplay) return priceDisplay
  return `$${(priceCents / 100).toFixed(0)}`
}

export function formatLabel(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
