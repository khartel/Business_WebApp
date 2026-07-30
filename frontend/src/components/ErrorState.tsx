import type { ReactNode } from "react"
import { AlertCircle, RotateCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  onRetry?: () => void
}

/**
 * Inline error placeholder for a section/query that failed to load (distinct
 * from `ErrorBoundary`, which catches render-time crashes at the app level).
 * Shows an icon, title, and description with sensible defaults, plus an
 * optional `onRetry` button — pass it a query's `refetch` to let the user
 * retry without a full page reload.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "Could not load this data. Please try again.",
  icon,
  onRetry,
}: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        {icon ?? <AlertCircle className="size-6" />}
      </div>
      <h3 className="font-heading text-base font-semibold">{t(title)}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t(description)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw className="size-3.5" />
          {t("Retry")}
        </Button>
      )}
    </div>
  )
}
