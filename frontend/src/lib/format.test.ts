import { describe, expect, test } from "vitest"
import { formatMoney, formatDate, formatDateTime } from "./format"

describe("formatMoney", () => {
  test("formats a known currency code with its symbol", () => {
    expect(formatMoney(1000, "USD")).toContain("1,000")
    expect(formatMoney(1000, "USD")).toContain("$")
  })

  test("falls back to a plain localized number + code for an unsupported currency code", () => {
    expect(formatMoney(1000, "NOT_A_CURRENCY")).toBe("1,000 NOT_A_CURRENCY")
  })
})

describe("formatDate", () => {
  test("formats an ISO date string as a short human-readable date", () => {
    expect(formatDate("2026-07-29T00:00:00.000Z")).toMatch(/Jul(y)?.*29.*2026/)
  })

  test("accepts a Date object directly", () => {
    expect(formatDate(new Date("2026-01-05T00:00:00.000Z"))).toMatch(/Jan(uary)?.*5.*2026/)
  })
})

describe("formatDateTime", () => {
  test("includes both the date and a time component", () => {
    const result = formatDateTime("2026-07-29T14:30:00.000Z")
    expect(result).toMatch(/2026/)
    expect(result).toMatch(/:/)
  })
})
