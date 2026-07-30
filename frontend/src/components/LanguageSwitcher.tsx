import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { storeLanguage } from "@/i18n"
import * as authService from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Adding a new language later: add an entry here, its `fr`-sibling locale
// folder under frontend/src/locales/, and register it in i18n.ts's
// `resources` — nothing else about this component needs to change. Keep
// the `code` list in sync with the backend's `language` enum in
// backend/src/validators/auth.validators.js.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
] as const

/**
 * Icon-button dropdown for switching the app's display language. Mirrors
 * `ThemeToggle`'s exact shape and is rendered in the same two places
 * (Topbar, for every role; Settings' Appearance card, SUPERADMIN-only) —
 * same component in both, no separate "compact" variant needed.
 *
 * Behavior differs slightly depending on auth state: logged-in users get
 * their choice saved to their account (via `updateProfile`) so it follows
 * them across devices; logged-out users (Login/Register) only get it
 * persisted to localStorage, since there's no account yet to save it to.
 * Either way the UI switches immediately — persistence is best-effort and
 * never blocks or reverts the visible language change.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const { user, refetchMe } = useAuth()

  const selectLanguage = async (code: string) => {
    if (code === i18n.language) return
    await i18n.changeLanguage(code)
    storeLanguage(code)

    if (user) {
      try {
        await authService.updateProfile({ language: code })
        await refetchMe()
      } catch {
        // Non-critical: the UI has already switched language locally: a
        // failed save just means the next visit may revert to the old
        // preference, not that anything is broken right now.
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("Change language")} className={className}>
          <Languages className="size-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => selectLanguage(option.code)}
            className={i18n.language === option.code ? "bg-accent text-accent-foreground" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
