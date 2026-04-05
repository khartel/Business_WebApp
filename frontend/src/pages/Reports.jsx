import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "../services/report.service";
import {
  BarChart3,
  Calendar,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Banknote,
  CreditCard,
  ChevronDown,
  Warehouse,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Reports() {
  const { businessId } = useParams();
  const [activeTab, setActiveTab] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const activeBusiness = localStorage.getItem("activeBusiness")
    ? JSON.parse(localStorage.getItem("activeBusiness"))
    : null;

  const currency = activeBusiness?.currency || "";

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  // ─────────────────────────────────────────
  // FETCH REPORTS
  // ─────────────────────────────────────────
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["report-daily", businessId, selectedDate],
    queryFn: () => reportService.daily(businessId, selectedDate),
    enabled: activeTab === "daily",
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ["report-weekly", businessId, selectedDate],
    queryFn: () => reportService.weekly(businessId, selectedDate),
    enabled: activeTab === "weekly",
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["report-monthly", businessId, selectedYear, selectedMonth],
    queryFn: () =>
      reportService.monthly(businessId, selectedYear, selectedMonth),
    enabled: activeTab === "monthly",
  });

  const { data: employeeData, isLoading: employeeLoading } = useQuery({
    queryKey: ["report-employees", businessId],
    queryFn: () => reportService.employees(businessId),
    enabled: activeTab === "employees",
  });

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ["report-products", businessId],
    queryFn: () => reportService.products(businessId),
    enabled: activeTab === "products",
  });

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["report-stock", businessId],
    queryFn: () => reportService.stockAlerts(businessId),
    enabled: activeTab === "stock",
  });

  const daily = dailyData?.data;
  const weekly = weeklyData?.data;
  const monthly = monthlyData?.data;
  const employeeReport = employeeData?.data;
  const productReport = productData?.data;
  const stockReport = stockData?.data;

  const tabs = [
    { id: "daily", label: "Daily", icon: Calendar },
    { id: "weekly", label: "Weekly", icon: TrendingUp },
    { id: "monthly", label: "Monthly", icon: BarChart3 },
    { id: "employees", label: "Employees", icon: Users },
    { id: "products", label: "Products", icon: Package },
    { id: "stock", label: "Stock Alerts", icon: AlertTriangle },
  ];

  const isLoading =
    dailyLoading ||
    weeklyLoading ||
    monthlyLoading ||
    employeeLoading ||
    productLoading ||
    stockLoading;

  // ─────────────────────────────────────────
  // CUSTOM TOOLTIP FOR CHARTS
  // ─────────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-3">
          <p className="text-dark-400 text-xs mb-1">{label}</p>
          <p className="text-white font-bold">
            {currency} {formatAmount(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Track your business performance"
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg
                        text-sm font-medium whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? "bg-primary-600 text-white"
                            : "bg-dark-800 text-dark-400 hover:text-white"
                        }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary-600
                          border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ─── DAILY REPORT ─── */}
      {activeTab === "daily" && daily && (
        <div className="space-y-6">
          {/* Date Picker */}
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-dark-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-base w-auto"
            />
            <span className="text-dark-400 text-sm">
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Total Sales</p>
              <p className="text-white text-xl font-bold">
                {currency} {formatAmount(daily.summary?.totalAmount)}
              </p>
              <p className="text-dark-500 text-xs mt-1">
                {daily.summary?.totalTransactions} transactions
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Cash</p>
              <p className="text-green-400 text-xl font-bold">
                {currency} {formatAmount(daily.summary?.cashTotal)}
              </p>
              <p className="text-dark-500 text-xs mt-1">
                {daily.summary?.cashTransactions} transactions
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Transfer</p>
              <p className="text-blue-400 text-xl font-bold">
                {currency} {formatAmount(daily.summary?.transferTotal)}
              </p>
              <p className="text-dark-500 text-xs mt-1">
                {daily.summary?.transferTransactions} transactions
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Products Sold</p>
              <p className="text-primary-400 text-xl font-bold">
                {daily.byProduct?.length || 0}
              </p>
              <p className="text-dark-500 text-xs mt-1">unique products</p>
            </div>
          </div>

          {/* Sales By Employee */}
          {daily.byEmployee?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-white font-semibold mb-4">
                Sales By Employee
              </h3>
              <div className="space-y-3">
                {daily.byEmployee.map((emp) => (
                  <div
                    key={emp.employee?.id}
                    className="flex items-center justify-between
                               bg-dark-800 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-600/20 rounded-xl
                                      flex items-center justify-center">
                        <span className="text-primary-400 font-bold text-sm">
                          {emp.employee?.fullName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {emp.employee?.fullName}
                        </p>
                        <p className="text-dark-400 text-xs">
                          {emp.transactionCount} transaction
                          {emp.transactionCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">
                        {currency} {formatAmount(emp.totalAmount)}
                      </p>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <span className="text-green-400 text-xs">
                          Cash: {currency}{" "}
                          {formatAmount(emp.cashAmount)}
                        </span>
                        <span className="text-blue-400 text-xs">
                          Transfer: {currency}{" "}
                          {formatAmount(emp.transferAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Products */}
          {daily.byProduct?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-white font-semibold mb-4">
                Products Sold Today
              </h3>
              <div className="space-y-3">
                {daily.byProduct.map((p, index) => (
                  <div
                    key={p.product?.id}
                    className="flex items-center justify-between
                               bg-dark-800 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-dark-700 rounded-lg
                                      flex items-center justify-center">
                        <span className="text-dark-400 text-xs font-bold">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {p.product?.name}
                        </p>
                        <p className="text-dark-400 text-xs">
                          {p.totalQuantity} {p.product?.unit} sold
                        </p>
                      </div>
                    </div>
                    <p className="text-white font-bold">
                      {currency} {formatAmount(p.totalRevenue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No sales for the day */}
          {daily.summary?.totalTransactions === 0 && (
            <div className="card p-12 text-center">
              <BarChart3
                size={40}
                className="text-dark-600 mx-auto mb-4"
              />
              <p className="text-white font-medium">No sales on this day</p>
              <p className="text-dark-400 text-sm mt-1">
                Select a different date or make some sales
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── WEEKLY REPORT ─── */}
      {activeTab === "weekly" && weekly && (
        <div className="space-y-6">
          {/* Date Picker */}
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-dark-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-base w-auto"
            />
            <span className="text-dark-400 text-sm">
              Week of {weekly.weekStart} to {weekly.weekEnd}
            </span>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Weekly Total</p>
              <p className="text-white text-xl font-bold">
                {currency} {formatAmount(weekly.summary?.totalAmount)}
              </p>
              <p className="text-dark-500 text-xs mt-1">
                {weekly.summary?.totalTransactions} transactions
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Cash</p>
              <p className="text-green-400 text-xl font-bold">
                {currency} {formatAmount(weekly.summary?.cashTotal)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Transfer</p>
              <p className="text-blue-400 text-xl font-bold">
                {currency} {formatAmount(weekly.summary?.transferTotal)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Best Day</p>
              <p className="text-primary-400 text-xl font-bold">
                {weekly.summary?.bestDay?.dayName}
              </p>
              <p className="text-dark-500 text-xs mt-1">
                {currency}{" "}
                {formatAmount(weekly.summary?.bestDay?.totalAmount)}
              </p>
            </div>
          </div>

          {/* Daily Breakdown Chart */}
          <div className="card p-6">
            <h3 className="text-white font-semibold mb-6">
              Daily Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekly.dailyBreakdown}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />
                <XAxis
                  dataKey="dayName"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="totalAmount"
                  fill="#0284c7"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Employee Breakdown */}
          {weekly.byEmployee?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-white font-semibold mb-4">
                Sales By Employee
              </h3>
              <div className="space-y-3">
                {weekly.byEmployee.map((emp) => (
                  <div
                    key={emp.employee?.id}
                    className="flex items-center justify-between
                               bg-dark-800 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-600/20 rounded-xl
                                      flex items-center justify-center">
                        <span className="text-primary-400 font-bold text-sm">
                          {emp.employee?.fullName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {emp.employee?.fullName}
                        </p>
                        <p className="text-dark-400 text-xs">
                          {emp.transactionCount} transactions
                        </p>
                      </div>
                    </div>
                    <p className="text-white font-bold">
                      {currency} {formatAmount(emp.totalAmount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MONTHLY REPORT ─── */}
      {activeTab === "monthly" && monthly && (
        <div className="space-y-6">
          {/* Month/Year Picker */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input-base w-auto"
            >
              {Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: new Date(2000, i).toLocaleString("en-US", {
                  month: "long",
                }),
              })).map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-base w-auto"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Monthly Total</p>
              <p className="text-white text-xl font-bold">
                {currency} {formatAmount(monthly.summary?.totalAmount)}
              </p>
              <p className="text-dark-500 text-xs mt-1">
                {monthly.summary?.totalTransactions} transactions
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Daily Average</p>
              <p className="text-primary-400 text-xl font-bold">
                {currency}{" "}
                {formatAmount(monthly.summary?.avgDailySales)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Cash Total</p>
              <p className="text-green-400 text-xl font-bold">
                {currency} {formatAmount(monthly.summary?.cashTotal)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Best Day</p>
              <p className="text-yellow-400 text-sm font-bold">
                {monthly.summary?.bestDay?.date}
              </p>
              <p className="text-dark-500 text-xs mt-1">
                {currency}{" "}
                {formatAmount(monthly.summary?.bestDay?.totalAmount)}
              </p>
            </div>
          </div>

          {/* Monthly Chart */}
          <div className="card p-6">
            <h3 className="text-white font-semibold mb-6">
              {monthly.month} — Daily Sales
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthly.dailyBreakdown}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.split("-")[2]}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="totalAmount"
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products for Month */}
          {monthly.byProduct?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-white font-semibold mb-4">
                Top Products This Month
              </h3>
              <div className="space-y-3">
                {monthly.byProduct.slice(0, 5).map((p, index) => (
                  <div
                    key={p.product?.id}
                    className="flex items-center justify-between
                               bg-dark-800 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-dark-500 text-sm font-bold w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {p.product?.name}
                        </p>
                        <p className="text-dark-400 text-xs">
                          {p.totalQuantity} {p.product?.unit} sold
                        </p>
                      </div>
                    </div>
                    <p className="text-white font-bold">
                      {currency} {formatAmount(p.totalRevenue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── EMPLOYEE REPORT ─── */}
      {activeTab === "employees" && employeeReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {employeeReport.employees?.map((emp) => (
              <div key={emp.employee?.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-600/20 rounded-xl
                                    flex items-center justify-center">
                      <span className="text-primary-400 font-bold text-lg">
                        {emp.employee?.fullName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {emp.employee?.fullName}
                      </p>
                      <p className="text-dark-400 text-sm">
                        @{emp.employee?.username} •{" "}
                        <span className="capitalize">
                          {emp.businessRole?.toLowerCase()}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-xl">
                      {currency}{" "}
                      {formatAmount(emp.summary?.totalAmount)}
                    </p>
                    <p className="text-dark-400 text-sm">
                      {emp.summary?.transactionCount} transactions
                    </p>
                  </div>
                </div>

                {/* Payment breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-dark-800 rounded-lg p-3 flex
                                  items-center gap-2">
                    <Banknote size={16} className="text-green-400" />
                    <div>
                      <p className="text-dark-400 text-xs">Cash</p>
                      <p className="text-green-400 font-medium text-sm">
                        {currency}{" "}
                        {formatAmount(emp.summary?.cashTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-dark-800 rounded-lg p-3 flex
                                  items-center gap-2">
                    <CreditCard size={16} className="text-blue-400" />
                    <div>
                      <p className="text-dark-400 text-xs">Transfer</p>
                      <p className="text-blue-400 font-medium text-sm">
                        {currency}{" "}
                        {formatAmount(emp.summary?.transferTotal)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top products for this employee */}
                {emp.topProducts?.length > 0 && (
                  <div>
                    <p className="text-dark-400 text-xs font-medium
                                  uppercase tracking-wider mb-2">
                      Top Products
                    </p>
                    <div className="space-y-2">
                      {emp.topProducts.slice(0, 3).map((p) => (
                        <div
                          key={p.product?.id}
                          className="flex items-center justify-between
                                     text-sm"
                        >
                          <span className="text-dark-300">
                            {p.product?.name}
                          </span>
                          <span className="text-white">
                            {p.totalQuantity} {p.product?.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {emp.summary?.transactionCount === 0 && (
                  <p className="text-dark-500 text-sm text-center py-4">
                    No sales recorded
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── PRODUCT REPORT ─── */}
      {activeTab === "products" && productReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">
                Total Products Sold
              </p>
              <p className="text-white text-2xl font-bold">
                {productReport.totalProducts}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">
                Top Earner
              </p>
              <p className="text-white text-xl font-bold">
                {productReport.bestSelling?.[0]?.product?.name || "N/A"}
              </p>
              <p className="text-dark-500 text-xs mt-1">
                {currency}{" "}
                {formatAmount(
                  productReport.bestSelling?.[0]?.totalRevenue
                )}
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-dark-700">
              <h3 className="text-white font-semibold">
                Best Selling Products
              </h3>
            </div>
            <div className="divide-y divide-dark-800">
              {productReport.bestSelling?.map((p, index) => (
                <div
                  key={p.product?.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-dark-500 font-bold text-sm w-6">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium">
                        {p.product?.name}
                      </p>
                      <p className="text-dark-400 text-xs">
                        {p.totalQuantity} {p.product?.unit} •{" "}
                        {p.timesSold} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">
                      {currency} {formatAmount(p.totalRevenue)}
                    </p>
                    <p className="text-dark-500 text-xs">
                      Avg {currency}{" "}
                      {formatAmount(p.avgUnitPrice)}/unit
                    </p>
                  </div>
                </div>
              ))}

              {productReport.bestSelling?.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-dark-400">
                    No product sales data yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── STOCK ALERTS ─── */}
      {activeTab === "stock" && stockReport && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 border-red-500/20">
              <p className="text-dark-400 text-xs mb-1">Out of Stock</p>
              <p className="text-red-400 text-2xl font-bold">
                {stockReport.summary?.outOfStockCount}
              </p>
              <p className="text-dark-500 text-xs mt-1">items</p>
            </div>
            <div className="card p-4 border-yellow-500/20">
              <p className="text-dark-400 text-xs mb-1">Low Stock</p>
              <p className="text-yellow-400 text-2xl font-bold">
                {stockReport.summary?.lowStockCount}
              </p>
              <p className="text-dark-500 text-xs mt-1">items</p>
            </div>
            <div className="card p-4 border-green-500/20">
              <p className="text-dark-400 text-xs mb-1">Healthy</p>
              <p className="text-green-400 text-2xl font-bold">
                {stockReport.summary?.healthyCount}
              </p>
              <p className="text-dark-500 text-xs mt-1">items</p>
            </div>
          </div>

          {/* Out of Stock */}
          {stockReport.outOfStock?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-dark-700 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                <h3 className="text-white font-semibold">
                  Out of Stock
                </h3>
              </div>
              <div className="divide-y divide-dark-800">
                {stockReport.outOfStock.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {item.product?.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Warehouse size={11} className="text-dark-500" />
                        <span className="text-dark-400 text-xs">
                          {item.warehouse?.name}
                          {item.warehouse?.isPrimary && (
                            <span className="text-yellow-400 ml-1">
                              (Primary)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <span className="badge-red">0 {item.product?.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock */}
          {stockReport.lowStock?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-dark-700 flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                <h3 className="text-white font-semibold">Low Stock</h3>
              </div>
              <div className="divide-y divide-dark-800">
                {stockReport.lowStock.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {item.product?.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Warehouse size={11} className="text-dark-500" />
                        <span className="text-dark-400 text-xs">
                          {item.warehouse?.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="badge-yellow">
                        {item.quantity} {item.product?.unit}
                      </span>
                      <p className="text-dark-500 text-xs mt-1">
                        Threshold: {item.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Good */}
          {stockReport.outOfStock?.length === 0 &&
            stockReport.lowStock?.length === 0 && (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl
                                flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={28} className="text-green-400" />
                </div>
                <p className="text-white font-semibold">
                  All Stock Levels Healthy
                </p>
                <p className="text-dark-400 text-sm mt-1">
                  No low stock or out of stock alerts
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}