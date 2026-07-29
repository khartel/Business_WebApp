/**
 * Small bordered tile displaying a single labeled metric (e.g. "Total sales" / "$1,234").
 * Purely presentational — used throughout the reports and detail-sheet screens to lay
 * out summary numbers in a grid.
 */
export function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-xl font-semibold">{value}</p>
    </div>
  )
}
