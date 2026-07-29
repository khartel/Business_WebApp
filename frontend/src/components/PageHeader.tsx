import type { ReactNode } from "react"

interface PageHeaderProps {
  title?: string
  description?: string
  action?: ReactNode
}

/**
 * Standard page-top header: title, optional description, and an optional
 * trailing `action` (e.g. a "New" button) aligned to the right. If both
 * `title` and `description` are omitted, it falls back to rendering just
 * the `action` right-aligned (or nothing at all), so pages that only need
 * an action row can reuse this component without an empty heading.
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  if (!title && !description) {
    return action ? <div className="flex justify-end">{action}</div> : null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        {title && <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>}
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
