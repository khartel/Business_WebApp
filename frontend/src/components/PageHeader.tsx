import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

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
 *
 * Translates `title`/`description` itself (source-text-as-key convention —
 * see i18n.ts), so the ~15 pages using this don't each need to wrap their
 * own title/description in `t()`.
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  const { t } = useTranslation()
  if (!title && !description) {
    return action ? <div className="flex justify-end">{action}</div> : null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        {title && <h1 className="font-heading text-3xl font-bold tracking-tight">{t(title)}</h1>}
        {description && <p className="mt-1 text-sm text-muted-foreground">{t(description)}</p>}
      </div>
      {action}
    </div>
  )
}
