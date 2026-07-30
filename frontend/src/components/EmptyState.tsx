import type { ReactNode } from "react"
import { Inbox } from "lucide-react"
import { useTranslation } from "react-i18next"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

/**
 * Generic placeholder shown when a list/table/section has no data.
 * Renders an icon (defaults to an inbox icon), a title, an optional
 * description, and an optional `action` (e.g. a "create new" button).
 *
 * Translates `title`/`description` itself (via the source-text-as-key
 * convention — see i18n.ts), so callers can just pass plain English text
 * without needing to wrap it in `t()` at each of the ~50 call sites across
 * the app.
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <h3 className="font-heading text-base font-semibold">{t(title)}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t(description)}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
