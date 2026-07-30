import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Package, Warehouse, Users, Receipt, AlertTriangle, ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { getBusinessById } from "@/services/business.service"
import * as transactionService from "@/services/transaction.service"
import * as reportService from "@/services/report.service"
import { canManage } from "@/lib/permissions"
import { formatDateTime, formatMoney } from "@/lib/format"
import { StatCard } from "@/components/dashboard/StatCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"

/**
 * Dashboard page — landing screen for the active business showing key
 * stats, low/out-of-stock alerts, recent sales, and a warehouse summary.
 *
 * Data loaded (all scoped to `activeBusinessId` from AuthContext):
 * - `["business", activeBusinessId]` via `getBusinessById` — counts for
 *   products/warehouses/team/transactions, plus the warehouse list.
 * - `["transactions", activeBusinessId, "recent"]` via
 *   `transactionService.getTransactions` (page 1, limit 5) — recent sales.
 * - `["report-stock-alerts", activeBusinessId]` via
 *   `reportService.getStockAlertReport` — only fetched when
 *   `canManage(user?.role)` is true, since alerts are a manager-only view.
 *
 * States: no active business (`EmptyState`, with copy that differs for
 * SUPERADMIN vs invited users), business fetch error (`ErrorState`), and
 * per-section loading skeletons/empty copy while each query resolves
 * independently.
 */
export default function Dashboard() {
  const { t } = useTranslation()
  const { user, activeBusinessId } = useAuth()
  const canSeeAlerts = canManage(user?.role)

  const businessQuery = useQuery({
    queryKey: ["business", activeBusinessId],
    queryFn: () => getBusinessById(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  const recentSalesQuery = useQuery({
    queryKey: ["transactions", activeBusinessId, "recent"],
    queryFn: () => transactionService.getTransactions(activeBusinessId!, { page: 1, limit: 5 }),
    enabled: !!activeBusinessId,
  })

  const stockAlertsQuery = useQuery({
    queryKey: ["report-stock-alerts", activeBusinessId],
    queryFn: () => reportService.getStockAlertReport(activeBusinessId!),
    enabled: !!activeBusinessId && canSeeAlerts,
  })

  if (!activeBusinessId) {
    return (
      <EmptyState
        title="No business selected"
        description={
          user?.role === "SUPERADMIN"
            ? "Create your first business to get started."
            : "You haven't been added to a business yet. Ask your admin to add you."
        }
      />
    )
  }

  if (businessQuery.isError) {
    return <ErrorState onRetry={() => businessQuery.refetch()} />
  }

  const business = businessQuery.data
  const currency = business?.currency ?? "USD"
  const recentSales = recentSalesQuery.data?.transactions ?? []
  const alerts = stockAlertsQuery.data

  return (
    <div className="space-y-6">
      {businessQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : business ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t("Products")} value={business._count.products} icon={Package} />
          <StatCard label={t("Warehouses")} value={business._count.warehouses} icon={Warehouse} />
          <StatCard label={t("Team Members")} value={business._count.businessUsers} icon={Users} accent="success" />
          <StatCard label={t("Total Sales")} value={business._count.transactions} icon={Receipt} />
        </div>
      ) : null}

      {canSeeAlerts && alerts && (alerts.summary.outOfStockCount > 0 || alerts.summary.lowStockCount > 0) && (
        <Card className="border-chart-4/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-chart-4" />
              {t("Stock alerts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="divide-y divide-border">
              {[...alerts.outOfStock, ...alerts.lowStock].slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium">{item.product.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{item.warehouse.name}</span>
                  </div>
                  <Badge
                    variant={item.quantity === 0 ? "destructive" : undefined}
                    className={item.quantity > 0 ? "bg-chart-4/15 text-chart-4" : undefined}
                  >
                    {t("{{quantity}} {{unit}} left", { quantity: item.quantity, unit: item.product.unit })}
                  </Badge>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" asChild>
              <Link to="/reports">
                {t("View full report")}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Recent sales")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSalesQuery.isLoading ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : recentSalesQuery.isError ? (
              <p className="text-sm text-destructive">{t("Couldn't load recent sales.")}</p>
            ) : recentSales.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentSales.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{tx.customerName}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
                    </div>
                    <span className="font-medium">{formatMoney(tx.totalAmount, currency)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("No sales recorded yet.")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Warehouses")}</CardTitle>
          </CardHeader>
          <CardContent>
            {business && business.warehouses.length > 0 ? (
              <ul className="divide-y divide-border">
                {business.warehouses.map((w) => (
                  <li key={w.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium">{w.name}</span>
                    <span className="text-muted-foreground">
                      {w.isPrimary ? t("Primary") : w.location ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("No warehouses set up yet.")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
