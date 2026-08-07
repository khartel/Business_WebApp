import RPNInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import type { Country } from "react-phone-number-input"
import { cn } from "@/lib/utils"

export type { Country as PhoneInputCountry }
export { isValidPhoneNumber } from "react-phone-number-input"

/**
 * Country-flag phone number input, styled to match the shadcn `Input`
 * shell (see the `.phone-input-field` rules in index.css, since the
 * library's internal class names can't be reached with Tailwind utilities).
 * Always stores/emits the number in E.164 format (e.g. "+2348012345678"),
 * regardless of how it's displayed while typing - this is the format the
 * backend validates with `libphonenumber-js`'s `isValidPhoneNumber`.
 *
 * Controlled component: pass `value`/`onChange` directly (not via RHF's
 * `register()`, which only works with plain DOM inputs) - use RHF's
 * `Controller` at call sites instead.
 */
export function PhoneInput({
  className,
  value,
  onChange,
  defaultCountry,
  ...props
}: {
  className?: string
  value: string | undefined
  onChange: (value: string) => void
  defaultCountry?: Country
  id?: string
  placeholder?: string
  "aria-invalid"?: boolean
  "aria-required"?: boolean
}) {
  return (
    <RPNInput
      international
      value={value}
      onChange={(next) => onChange(next ?? "")}
      defaultCountry={defaultCountry}
      className={cn("phone-input-field", className)}
      {...props}
    />
  )
}
