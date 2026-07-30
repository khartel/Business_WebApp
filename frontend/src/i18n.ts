// i18next configuration. Every user-facing string in the app is wrapped as
// `t("Exact English Sentence")` — the English text itself IS the
// translation key (no parallel key-naming scheme to maintain). Only
// non-English catalogs need to exist: if a key has no entry in the active
// language's namespace file, i18next falls back to returning the key
// itself, which — since the key is the original English text — degrades
// gracefully to "shows English" instead of a blank string or crash.
//
// Adding a new language later is additive: add its resources below and a
// matching entry to `SUPPORTED_LANGUAGES` in `components/LanguageSwitcher.tsx`.
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import frCommon from "@/locales/fr/common.json"
import frAuth from "@/locales/fr/auth.json"
import frDashboard from "@/locales/fr/dashboard.json"
import frPos from "@/locales/fr/pos.json"
import frProducts from "@/locales/fr/products.json"
import frWarehouses from "@/locales/fr/warehouses.json"
import frStock from "@/locales/fr/stock.json"
import frCustomers from "@/locales/fr/customers.json"
import frTeam from "@/locales/fr/team.json"
import frReports from "@/locales/fr/reports.json"
import frSettings from "@/locales/fr/settings.json"
import frBusinesses from "@/locales/fr/businesses.json"
import frTransactions from "@/locales/fr/transactions.json"
import frPlatform from "@/locales/fr/platform.json"
import frErrors from "@/locales/fr/errors.json"

// Namespaces mirror the app's feature areas so each translation file stays
// a manageable size and easy to review/edit.
export const NAMESPACES = [
  "common",
  "auth",
  "dashboard",
  "pos",
  "products",
  "warehouses",
  "stock",
  "customers",
  "team",
  "reports",
  "settings",
  "businesses",
  "transactions",
  "platform",
  "errors",
] as const

const STORAGE_KEY = "d-inventory:language"

/** Reads the pre-login language choice (no account yet). Defaults to "en". */
function getStoredLanguage(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "en"
}

/** Persists the pre-login/local language choice (mirrors ThemeContext's pattern). */
export function storeLanguage(code: string) {
  localStorage.setItem(STORAGE_KEY, code)
}

i18n.use(initReactI18next).init({
  lng: getStoredLanguage(),
  fallbackLng: "en",
  defaultNS: "common",
  // Components don't need to know/guess which specific namespace file a
  // given string ends up organized under — a bare `t("Some text")` checks
  // "common" first, then falls through every other namespace, so lookups
  // work regardless of where the translation was actually filed.
  fallbackNS: NAMESPACES,
  ns: NAMESPACES,
  // English has no catalog on purpose — the source text is already the
  // desired English output, so only non-English resources are needed.
  resources: {
    fr: {
      common: frCommon,
      auth: frAuth,
      dashboard: frDashboard,
      pos: frPos,
      products: frProducts,
      warehouses: frWarehouses,
      stock: frStock,
      customers: frCustomers,
      team: frTeam,
      reports: frReports,
      settings: frSettings,
      businesses: frBusinesses,
      transactions: frTransactions,
      platform: frPlatform,
      errors: frErrors,
    },
  },
  interpolation: {
    escapeValue: false, // React already escapes output; avoid double-escaping.
  },
  returnNull: false,
})

export default i18n
