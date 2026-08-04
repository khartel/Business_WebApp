import type { ReactNode } from "react"
import { Boxes } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AuthBackground } from "@/components/auth/AuthBackground"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

interface AuthShellProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Shared layout shell for all auth pages (login, 2FA, change-password, etc).
 * Renders the animated `AuthBackground`, a theme toggle in the top-right
 * corner, and a centered glass card containing a branded header
 * (`title`/`description`), arbitrary `children` (the actual form), and an
 * optional `footer` (e.g. "Don't have an account?" links). Together with
 * `AuthField`/`AuthBackground`, this is one of the shared primitives that
 * every auth screen composes rather than reimplementing its own chrome.
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  const { t } = useTranslation()
  return (
    <div className="relative flex min-h-svh items-center justify-center p-4">
      <AuthBackground />

      <div className="absolute right-4 top-4 flex items-center gap-1.5">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-[2rem] border border-border/60 bg-white/60 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-success text-primary-foreground shadow-lg shadow-primary/20">
            <Boxes className="size-6" />
          </div>
          <p className="font-heading text-base font-bold tracking-tight">VAE Inventory</p>
          <h1 className="mt-3 font-heading text-xl font-semibold">{t(title)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(description)}</p>
        </div>

        {children}

        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  )
}
