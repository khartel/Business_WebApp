import { forwardRef, useId, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthFieldProps extends React.ComponentProps<"input"> {
  icon: LucideIcon
  label: string
  error?: string
}

/**
 * Shared pill-shaped text input used across auth pages (login, register,
 * change-password, etc.) — pairs a leading icon with a visually-hidden
 * `<label>` (for accessibility) and an optional error message below it.
 * Forwards its ref to the underlying `<input>` so it works with react-hook-form's
 * `register`. When `type="password"`, an eye/eye-off toggle button is shown
 * that flips the rendered input's `type` between "password" and "text" to
 * let the user reveal/hide what they typed; this is purely a local UI
 * concern and doesn't affect the value passed to forms.
 */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ icon: Icon, label, error, id, className, type, ...props }, ref) => {
    const autoId = useId()
    const inputId = id ?? autoId
    const isPassword = type === "password"
    const [visible, setVisible] = useState(false) // tracks password reveal state (password fields only)

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <div
          className={cn(
            "flex items-center gap-3 rounded-full border bg-white/50 px-2 py-1.5 backdrop-blur-sm transition-colors",
            "border-border/60 focus-within:border-primary focus-within:bg-white/70",
            "dark:border-white/15 dark:bg-white/5 dark:focus-within:border-primary dark:focus-within:bg-white/10",
            error && "border-destructive/60 dark:border-destructive/60"
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-foreground/60 dark:bg-white/10 dark:text-foreground/70">
            <Icon className="size-4" />
          </span>
          <input
            id={inputId}
            ref={ref}
            type={isPassword ? (visible ? "text" : "password") : type}
            aria-invalid={!!error}
            className={cn(
              "w-full bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground/50 hover:text-foreground/80"
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}
        </div>
        {error && <p className="pl-4 text-xs text-destructive">{error}</p>}
      </div>
    )
  }
)
AuthField.displayName = "AuthField"
