import { useTranslation } from "react-i18next"

/**
 * Small bordered tile displaying a single labeled metric (e.g. "Total sales" / "$1,234").
 * Purely presentational — used throughout the reports and detail-sheet screens to lay
 * out summary numbers in a grid.
 *
 * Translates `label` itself (source-text-as-key convention — see i18n.ts), so callers
 * can pass plain English text without wrapping it in `t()` at each call site.
 */
export function SummaryStat({ label, value }: { label: string; value: string | number }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{t(label)}</p>
      <p className="font-heading text-xl font-semibold">{value}</p>
    </div>
  )
}
