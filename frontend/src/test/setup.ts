import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import "@/i18n"

// Explicit cleanup after each test since vitest globals aren't enabled
// (test files import describe/test/expect/etc. from "vitest" directly) —
// @testing-library/react's own auto-cleanup only self-registers when it
// finds a global `afterEach`.
afterEach(() => {
  cleanup()
})

// jsdom doesn't implement matchMedia; ThemeContext reads it to detect the
// OS-level light/dark preference. Stub it so components using useTheme()
// (and anything they render, like ThemeToggle) don't crash under test.
// jsdom also doesn't implement ResizeObserver, which several Radix UI
// primitives (e.g. Checkbox) use internally to measure themselves.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
