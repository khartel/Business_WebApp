import { useQuery } from "@tanstack/react-query"
import * as reportService from "@/services/report.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { formatMoney } from "@/lib/format"
import { EmptyState } from "@/components/EmptyState"
import { SummaryStat } from "@/components/reports/SummaryStat"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays } from "lucide-react"

export function DailyReportTab() {
  const { activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? "USD"

  const query = useQuery({
    queryKey: ["report-daily", activeBusinessId],
    queryFn: () => reportService.getDailyReport(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  if (query.isLoading) return <Skeleton className="h-64 rounded-xl" />
  const report = query.data
  if (!report) return null

  if (report.summary.totalTransactions === 0) {
    return (
      <EmptyState icon={<CalendarDays className="size-6" />} title="No sales today" description={report.date} />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryStat label="Total sales" value={formatMoney(report.summary.totalAmount, currency)} />
        <SummaryStat label="Transactions" value={report.summary.totalTransactions} />
        <SummaryStat label="Cash" value={formatMoney(report.summary.cashTotal, currency)} />
        <SummaryStat label="Transfer" value={formatMoney(report.summary.transferTotal, currency)} />
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
