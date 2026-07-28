import { BarChart3 } from "lucide-react"
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

export default function Reports() {
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
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="stock">Stock alerts</TabsTrigger>
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
