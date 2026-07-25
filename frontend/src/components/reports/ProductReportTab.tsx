import { useQuery } from "@tanstack/react-query"
import * as reportService from "@/services/report.service"
import type { ProductReportItem } from "@/services/report.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { formatMoney } from "@/lib/format"
import { EmptyState } from "@/components/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { Package } from "lucide-react"

function ProductList({ items, currency, metric }: { items: ProductReportItem[]; currency: string; metric: "revenue" | "quantity" }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((row) => (
        <li key={row.product.id} className="flex items-center justify-between">
          <div>
            <p className="font-medium">{row.product.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.currentStock.total} {row.product.unit} in stock
            </p>
          </div>
          <span className="font-medium">
            {metric === "revenue" ? formatMoney(row.totalRevenue, currency) : `${row.totalQuantity} ${row.product.unit}`}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ProductReportTab() {
  const { activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? "USD"

  const query = useQuery({
    queryKey: ["report-products", activeBusinessId],
    queryFn: () => reportService.getProductReport(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  if (query.isLoading) return <Skeleton className="h-64 rounded-xl" />
  const report = query.data
  if (!report) return null

  if (report.totalProducts === 0 || report.bestSelling.length === 0) {
    return (
      <EmptyState icon={<Package className="size-6" />} title="No product sales yet" description="Product performance will show up here once you record sales." />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold">Best selling (by revenue)</h3>
        <ProductList items={report.bestSelling} currency={currency} metric="revenue" />
      </div>
      <div className="rounded-xl border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold">Most quantity sold</h3>
        <ProductList items={report.mostQuantitySold} currency={currency} metric="quantity" />
      </div>
    </div>
  )
}
