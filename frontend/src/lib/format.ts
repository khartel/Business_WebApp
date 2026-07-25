/** Formats an amount using the business's currency code (e.g. "NGN", "USD"). */
export function formatMoney(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
    }).format(amount)
  } catch {
    // Unknown/unsupported currency code - fall back to a plain number with the code.
    return `${amount.toLocaleString()} ${currencyCode}`
  }
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
