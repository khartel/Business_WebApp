import { useQuery } from "@tanstack/react-query"
import * as reportService from "@/services/report.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { formatMoney } from "@/lib/format"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { SummaryStat } from "@/components/reports/SummaryStat"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays } from "lucide-react"

export function MonthlyReportTab() {
  const { activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? "USD"

  const query = useQuery({
    queryKey: ["report-monthly", activeBusinessId],
    queryFn: () => reportService.getMonthlyReport(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  if (query.isLoading) return <Skeleton className="h-64 rounded-xl" />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />
  const report = query.data
  if (!report) return null

  if (report.summary.totalTransactions === 0) {
    return (
      <EmptyState icon={<CalendarDays className="size-6" />} title="No sales this month" description={report.month} />
    )
  }

  const maxDayAmount = Math.max(...report.dailyBreakdown.map((d) => d.totalAmount), 1)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryStat label="Total sales" value={formatMoney(report.summary.totalAmount, currency)} />
        <SummaryStat label="Transactions" value={report.summary.totalTransactions} />
        <SummaryStat label="Avg / day" value={formatMoney(report.summary.avgDailySales ?? 0, currency)} />
        <SummaryStat label="Best day" value={report.summary.bestDay ? report.summary.bestDay.dayName : "—"} />
      </div>

      <div className="rounded-xl border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold">Daily breakdown</h3>
        <div className="flex h-32 items-end gap-1">
          {report.dailyBreakdown.map((day) => (
            <div
              key={day.date}
              title={`${day.dayName}: ${formatMoney(day.totalAmount, currency)}`}
              className="flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
              style={{ height: `${Math.max((day.totalAmount / maxDayAmount) * 100, 2)}%` }}
            />
          ))}
        </div>
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
