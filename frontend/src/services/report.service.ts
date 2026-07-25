import { apiClient, apiRequest } from "@/lib/api-client"

interface Employee {
  id: string
  fullName: string
  username: string
  role?: string
}

interface ProductRef {
  id: string
  name: string
  unit: string
  description?: string | null
}

export interface PeriodSummary {
  totalAmount: number
  totalTransactions: number
  cashTotal: number
  transferTotal: number
  avgDailySales?: number
  bestDay?: { date: string; dayName: string; totalAmount: number; transactionCount: number }
}

export interface ProductBreakdown {
  product: ProductRef
  totalQuantity: number
  totalRevenue: number
  timesSold?: number
}

export interface EmployeeBreakdown {
  employee: Employee
  totalAmount: number
  transactionCount: number
}

export interface DailyReport {
  date: string
  summary: PeriodSummary & { cashTransactions: number; transferTransactions: number }
  byEmployee: Array<EmployeeBreakdown & { cashAmount: number; transferAmount: number }>
  byProduct: ProductBreakdown[]
}

export interface DailyBreakdownEntry {
  date: string
  dayName: string
  totalAmount: number
  transactionCount: number
  cashTotal?: number
  transferTotal?: number
}

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  summary: PeriodSummary
  dailyBreakdown: DailyBreakdownEntry[]
  byEmployee: EmployeeBreakdown[]
  byProduct: ProductBreakdown[]
}

export interface MonthlyReport {
  month: string
  monthStart: string
  monthEnd: string
  summary: PeriodSummary
  dailyBreakdown: DailyBreakdownEntry[]
  byEmployee: EmployeeBreakdown[]
  byProduct: ProductBreakdown[]
}

export interface EmployeeReport {
  startDate: string
  endDate: string
  employees: Array<{
    employee: Employee
    businessRole: string
    summary: { totalAmount: number; transactionCount: number; cashTotal: number; transferTotal: number }
    topProducts: ProductBreakdown[]
  }>
}

export interface ProductReportItem extends ProductBreakdown {
  avgUnitPrice: number
  currentStock: {
    total: number
    byWarehouse: Array<{ warehouse: { id: string; name: string; isPrimary: boolean }; quantity: number }>
  }
}

export interface ProductReport {
  startDate: string
  endDate: string
  totalProducts: number
  bestSelling: ProductReportItem[]
  mostQuantitySold: ProductReportItem[]
}

export interface StockAlertItem {
  id: string
  quantity: number
  lowStockThreshold: number
  product: ProductRef
  warehouse: { id: string; name: string; isPrimary: boolean }
}

export interface StockAlertReport {
  summary: { totalItems: number; outOfStockCount: number; lowStockCount: number; healthyCount: number }
  outOfStock: StockAlertItem[]
  lowStock: StockAlertItem[]
  healthyStock: StockAlertItem[]
}

export const getDailyReport = (businessId: string, date?: string) =>
  apiRequest<DailyReport>(apiClient.get(`/businesses/${businessId}/reports/daily`, { params: { date } }))

export const getWeeklyReport = (businessId: string, date?: string) =>
  apiRequest<WeeklyReport>(apiClient.get(`/businesses/${businessId}/reports/weekly`, { params: { date } }))

export const getMonthlyReport = (businessId: string, year?: number, month?: number) =>
  apiRequest<MonthlyReport>(apiClient.get(`/businesses/${businessId}/reports/monthly`, { params: { year, month } }))

export const getEmployeeReport = (businessId: string, startDate?: string, endDate?: string) =>
  apiRequest<EmployeeReport>(
    apiClient.get(`/businesses/${businessId}/reports/employees`, { params: { startDate, endDate } })
  )

export const getProductReport = (businessId: string, startDate?: string, endDate?: string) =>
  apiRequest<ProductReport>(
    apiClient.get(`/businesses/${businessId}/reports/products`, { params: { startDate, endDate } })
  )

export const getStockAlertReport = (businessId: string) =>
  apiRequest<StockAlertReport>(apiClient.get(`/businesses/${businessId}/reports/stock`))
