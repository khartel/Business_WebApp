import { forwardRef, useId } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthFieldProps extends React.ComponentProps<"input"> {
  icon: LucideIcon
  label: string
  error?: string
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ icon: Icon, label, error, id, className, ...props }, ref) => {
    const autoId = useId()
    const inputId = id ?? autoId

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
            aria-invalid={!!error}
            className={cn(
              "w-full bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="pl-4 text-xs text-destructive">{error}</p>}
      </div>
    )
  }
)
AuthField.displayName = "AuthField"
