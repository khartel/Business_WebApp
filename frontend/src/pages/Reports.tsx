import { BarChart3 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { canManage } from "@/lib/permissions"
import { EmptyState } from "@/components/EmptyState"
import { DailyReportTab } from "@/components/reports/DailyReportTab"
import { WeeklyReportTab } from "@/components/reports/WeeklyReportTab"
import { MonthlyReportTab } from "@/components/reports/MonthlyReportTab"
import { EmployeeReportTab } from "@/components/reports/EmployeeReportTab"
import { ProductReportTab } from "@/components/reports/ProductReportTab"
import { StockAlertsTab } from "@/components/reports/StockAlertsTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Reports page — manager-only analytics hub for the active business,
 * organized into six tabs, each a self-contained component that fetches
 * its own data and offers a CSV/PDF export (via `DownloadMenu` /
 * `lib/csv.ts` + `lib/pdf.ts`) of what's currently displayed:
 * - Daily / Weekly / Monthly (`DailyReportTab`, `WeeklyReportTab`,
 *   `MonthlyReportTab`): sales totals over the respective time window.
 * - Employees (`EmployeeReportTab`): sales performance broken down by team
 *   member.
 * - Products (`ProductReportTab`): sales/revenue broken down by product.
 * - Stock alerts (`StockAlertsTab`): low-stock and out-of-stock items,
 *   the same data source as the Dashboard's stock alert card.
 *
 * Access control: gated by `canManage(user?.role)` — employees never see
 * this page. Also requires an active business; both cases fall back to an
 * `EmptyState`. This page itself does no data fetching — each tab owns its
 * own query.
 */
export default function Reports() {
  const { t } = useTranslation()
  const { user, activeBusinessId } = useAuth()

  if (!canManage(user?.role)) {
    return (
      <EmptyState
        icon={<BarChart3 className="size-6" />}
        title="Not available"
        description="Reports are only visible to owners and admins."
      />
    )
  }

  if (!activeBusinessId) {
    return (
      <EmptyState
        icon={<BarChart3 className="size-6" />}
        title="No business selected"
        description="Select or create a business to view reports."
      />
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">{t("Daily")}</TabsTrigger>
          <TabsTrigger value="weekly">{t("Weekly")}</TabsTrigger>
          <TabsTrigger value="monthly">{t("Monthly")}</TabsTrigger>
          <TabsTrigger value="employees">{t("Employees")}</TabsTrigger>
          <TabsTrigger value="products">{t("Products")}</TabsTrigger>
          <TabsTrigger value="stock">{t("Stock alerts")}</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyReportTab />
        </TabsContent>
        <TabsContent value="weekly">
          <WeeklyReportTab />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlyReportTab />
        </TabsContent>
        <TabsContent value="employees">
          <EmployeeReportTab />
        </TabsContent>
        <TabsContent value="products">
          <ProductReportTab />
        </TabsContent>
        <TabsContent value="stock">
          <StockAlertsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
