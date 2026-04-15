export function formatDuration(durationMinutes: number) {
  return `${durationMinutes}min`
}

export function formatPrice(priceCents: number, priceDisplay: string | null) {
  if (priceDisplay?.trim()) {
    return priceDisplay
  }

  const amount = priceCents / 100

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
