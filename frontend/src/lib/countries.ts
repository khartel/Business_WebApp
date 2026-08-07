import type { PhoneInputCountry as Country } from "@/components/ui/phone-input"

// Maps the country *names* stored on a Business (see business.service.ts's
// getCountries()/backend's currencies.js, which use full names like
// "Nigeria" rather than ISO codes) to the ISO 3166-1 alpha-2 code the
// phone-input library needs for its `defaultCountry` prop. Covers the same
// country list the app already supports at business-creation time. A name
// not found here just means the phone input has no preset default country -
// not a hard failure, the user can still pick one manually.
const COUNTRY_NAME_TO_ISO: Record<string, Country> = {
  Togo: "TG",
  Benin: "BJ",
  Senegal: "SN",
  Mali: "ML",
  "Burkina Faso": "BF",
  Niger: "NE",
  "Guinea-Bissau": "GW",
  "Ivory Coast": "CI",
  Cameroon: "CM",
  Chad: "TD",
  Gabon: "GA",
  Congo: "CG",
  Nigeria: "NG",
  Ghana: "GH",
  Kenya: "KE",
  "South Africa": "ZA",
  Ethiopia: "ET",
  Tanzania: "TZ",
  Uganda: "UG",
  Rwanda: "RW",
  Egypt: "EG",
  Morocco: "MA",
  Algeria: "DZ",
  Tunisia: "TN",
  Angola: "AO",
  Mozambique: "MZ",
  Zambia: "ZM",
  Zimbabwe: "ZW",
  "United Kingdom": "GB",
  Germany: "DE",
  France: "FR",
  Italy: "IT",
  Spain: "ES",
  Portugal: "PT",
  Netherlands: "NL",
  Belgium: "BE",
  Switzerland: "CH",
  Sweden: "SE",
  Norway: "NO",
  Denmark: "DK",
  Poland: "PL",
  Russia: "RU",
  "United States": "US",
  Canada: "CA",
  Brazil: "BR",
  Mexico: "MX",
  Argentina: "AR",
  Colombia: "CO",
  Chile: "CL",
  Peru: "PE",
  China: "CN",
  Japan: "JP",
  India: "IN",
  "South Korea": "KR",
  Singapore: "SG",
  Malaysia: "MY",
  Indonesia: "ID",
  Thailand: "TH",
  Vietnam: "VN",
  Philippines: "PH",
  Pakistan: "PK",
  Bangladesh: "BD",
  UAE: "AE",
  "Saudi Arabia": "SA",
  Qatar: "QA",
  Kuwait: "KW",
  Australia: "AU",
  "New Zealand": "NZ",
}

/** Best-effort lookup of a phone-input default country from a stored business/country name. Returns undefined (no preset) if unrecognized. */
export function countryNameToIso(name: string | undefined): Country | undefined {
  return name ? COUNTRY_NAME_TO_ISO[name] : undefined
}
