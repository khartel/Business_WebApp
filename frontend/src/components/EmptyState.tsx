import type { ReactNode } from "react"
import { Inbox } from "lucide-react"

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
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
