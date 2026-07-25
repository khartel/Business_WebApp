import { useQuery } from "@tanstack/react-query"
import * as reportService from "@/services/report.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { formatMoney } from "@/lib/format"
import { EmptyState } from "@/components/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from "lucide-react"

export function EmployeeReportTab() {
  const { activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? "USD"

  const query = useQuery({
    queryKey: ["report-employees", activeBusinessId],
    queryFn: () => reportService.getEmployeeReport(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  if (query.isLoading) return <Skeleton className="h-64 rounded-xl" />
  const report = query.data
  if (!report) return null

  if (report.employees.length === 0) {
    return (
      <EmptyState icon={<Users className="size-6" />} title="No employee activity" description="No sales recorded by any employee in this period." />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {report.employees.map(({ employee, businessRole, summary, topProducts }) => (
        <div key={employee.id} className="rounded-xl border border-border p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="font-heading text-sm font-semibold">{employee.fullName}</h3>
              <p className="text-xs text-muted-foreground">{businessRole}</p>
            </div>
            <p className="text-right font-medium">{formatMoney(summary.totalAmount, currency)}</p>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-semibold">{summary.transactionCount}</p>
              <p className="text-muted-foreground">Sales</p>
            </div>
            <div>
              <p className="font-semibold">{formatMoney(summary.cashTotal, currency)}</p>
              <p className="text-muted-foreground">Cash</p>
            </div>
            <div>
              <p className="font-semibold">{formatMoney(summary.transferTotal, currency)}</p>
              <p className="text-muted-foreground">Transfer</p>
            </div>
          </div>
          {topProducts.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Top products</p>
              <ul className="space-y-1 text-sm">
                {topProducts.map((row) => (
                  <li key={row.product.id} className="flex justify-between">
                    <span>{row.product.name}</span>
                    <span className="text-muted-foreground">× {row.totalQuantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
