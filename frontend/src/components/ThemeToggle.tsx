import { Moon, Sun, Monitor } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const OPTIONS = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
]

/**
 * Icon-button dropdown for switching between light/dark/system theme.
 * Reads/writes theme state via `useTheme()`; the trigger icon reflects the
 * currently *resolved* theme (i.e. what "system" resolves to), while the
 * dropdown highlights whichever option (light/dark/system) is actually
 * selected.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("Toggle theme")} className={className}>
          {resolvedTheme === "dark" ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={theme === option.value ? "bg-accent text-accent-foreground" : ""}
          >
            <option.icon className="size-4" />
            {t(option.label)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
