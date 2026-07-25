import { useQuery } from "@tanstack/react-query"
import * as reportService from "@/services/report.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { formatDate, formatMoney } from "@/lib/format"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { SummaryStat } from "@/components/reports/SummaryStat"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarRange } from "lucide-react"

export function WeeklyReportTab() {
  const { activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? "USD"

  const query = useQuery({
    queryKey: ["report-weekly", activeBusinessId],
    queryFn: () => reportService.getWeeklyReport(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  if (query.isLoading) return <Skeleton className="h-64 rounded-xl" />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />
  const report = query.data
  if (!report) return null

  if (report.summary.totalTransactions === 0) {
    return (
      <EmptyState
        icon={<CalendarRange className="size-6" />}
        title="No sales this week"
        description={`${formatDate(report.weekStart)} – ${formatDate(report.weekEnd)}`}
      />
    )
  }

  const maxDayAmount = Math.max(...report.dailyBreakdown.map((d) => d.totalAmount), 1)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryStat label="Total sales" value={formatMoney(report.summary.totalAmount, currency)} />
        <SummaryStat label="Transactions" value={report.summary.totalTransactions} />
        <SummaryStat
          label="Avg / day"
          value={formatMoney(report.summary.avgDailySales ?? 0, currency)}
        />
        <SummaryStat
          label="Best day"
          value={report.summary.bestDay ? report.summary.bestDay.dayName : "—"}
        />
      </div>

      <div className="rounded-xl border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold">Daily breakdown</h3>
        <ul className="space-y-2">
          {report.dailyBreakdown.map((day) => (
            <li key={day.date} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-muted-foreground">{day.dayName}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                  style={{ width: `${(day.totalAmount / maxDayAmount) * 100}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right font-medium">
                {formatMoney(day.totalAmount, currency)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-3 text-sm font-semibold">By employee</h3>
          <ul className="space-y-2 text-sm">
            {report.byEmployee.map((row) => (
              <li key={row.employee.id} className="flex justify-between">
                <span>{row.employee.fullName}</span>
                <span className="font-medium">{formatMoney(row.totalAmount, currency)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-3 text-sm font-semibold">By product</h3>
          <ul className="space-y-2 text-sm">
            {report.byProduct.map((row) => (
              <li key={row.product.id} className="flex justify-between">
                <span>
                  {row.product.name} × {row.totalQuantity}
                </span>
                <span className="font-medium">{formatMoney(row.totalRevenue, currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
