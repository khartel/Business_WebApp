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
  Banknote,
  CreditCard,
  Printer,
  Warehouse,
  Check,
  X,
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

// ─────────────────────────────────────────
// PRINT OPTIONS MODAL
// ─────────────────────────────────────────
function PrintOptionsModal({ isOpen, onClose, onPrint, reportType }) {
  const [selected, setSelected] = useState({
    summary: true,
    itemsSold: true,
    transactionLog: true,
    employeeBreakdown: true,
  });

  if (!isOpen) return null;

  const toggle = (key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allSelected = Object.values(selected).every(Boolean);

  const toggleAll = () => {
    const next = !allSelected;
    setSelected({
      summary: next,
      itemsSold: next,
      transactionLog: next,
      employeeBreakdown: next,
    });
  };

  const options = [
    {
      key: "summary",
      label: "Summary",
      description: "Total sales, cash, transfer, products sold",
      icon: BarChart3,
    },
    {
      key: "itemsSold",
      label: "Items Sold",
      description: "All products sold with quantity and revenue",
      icon: Package,
    },
    {
      key: "transactionLog",
      label: "Transaction Log",
      description: "Every transaction with time, customer and amount",
      icon: Calendar,
    },
    {
      key: "employeeBreakdown",
      label: "Sales by Employees",
      description: "Each employee's sales performance",
      icon: Users,
    },
  ];

  // For weekly/monthly — swap transactionLog for dailyBreakdown
  const weeklyMonthlyOptions = [
    {
      key: "summary",
      label: "Summary",
      description: "Total sales, cash, transfer breakdown",
      icon: BarChart3,
    },
    {
      key: "itemsSold",
      label: "Products Sold",
      description: "Top products with quantity and revenue",
      icon: Package,
    },
    {
      key: "transactionLog",
      label: "Daily Breakdown",
      description: "Sales figures broken down by day",
      icon: Calendar,
    },
    {
      key: "employeeBreakdown",
      label: "Sales by Employees",
      description: "Each employee's sales performance",
      icon: Users,
    },
  ];

  const displayOptions =
    reportType === "daily" ? options : weeklyMonthlyOptions;

  const noneSelected = Object.values(selected).every((v) => !v);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      {/* Modal */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl
                      w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6
                        border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600/20 rounded-xl
                            flex items-center justify-center">
              <Printer size={18} className="text-primary-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Print Report</h3>
              <p className="text-dark-400 text-xs mt-0.5">
                Select sections to include
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">

          {/* Select All */}
          <button
            onClick={toggleAll}
            className={`w-full flex items-center justify-between p-3
                        rounded-xl border-2 transition-all duration-200
                        ${
                          allSelected
                            ? "border-primary-500 bg-primary-500/10"
                            : "border-dark-600 hover:border-dark-500"
                        }`}
          >
            <span
              className={`text-sm font-semibold ${
                allSelected ? "text-primary-400" : "text-dark-300"
              }`}
            >
              Select All Sections
            </span>
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center
                          justify-center transition-all ${
                            allSelected
                              ? "border-primary-500 bg-primary-500"
                              : "border-dark-500"
                          }`}
            >
              {allSelected && <Check size={12} className="text-white" />}
            </div>
          </button>

          <div className="border-t border-dark-700 pt-3 space-y-2">
            {displayOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => toggle(opt.key)}
                className={`w-full flex items-center justify-between p-4
                            rounded-xl border-2 transition-all duration-200
                            text-left ${
                              selected[opt.key]
                                ? "border-primary-500 bg-primary-500/10"
                                : "border-dark-700 hover:border-dark-600"
                            }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center
                                justify-center ${
                                  selected[opt.key]
                                    ? "bg-primary-600/20"
                                    : "bg-dark-800"
                                }`}
                  >
                    <opt.icon
                      size={16}
                      className={
                        selected[opt.key]
                          ? "text-primary-400"
                          : "text-dark-400"
                      }
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        selected[opt.key] ? "text-white" : "text-dark-300"
                      }`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-dark-500 text-xs mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center
                              justify-center flex-shrink-0 transition-all ${
                                selected[opt.key]
                                  ? "border-primary-500 bg-primary-500"
                                  : "border-dark-600"
                              }`}
                >
                  {selected[opt.key] && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-dark-600
                       text-dark-300 text-sm font-medium hover:border-dark-500
                       hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onPrint(selected);
              onClose();
            }}
            disabled={noneSelected}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary-600
                       hover:bg-primary-500 text-white text-sm font-medium
                       transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed flex items-center
                       justify-center gap-2"
          >
            <Printer size={16} />
            Print Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
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

  // Print modal state
  const [printModal, setPrintModal] = useState({
    open: false,
    type: null, // "daily" | "weekly" | "monthly"
  });

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
  // CUSTOM TOOLTIP
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

  // ─────────────────────────────────────────
  // SHARED PRINT HTML HELPERS
  // ─────────────────────────────────────────
  const sharedStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 20mm 15mm;
    }
    h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
    h2 {
      font-size: 15px; font-weight: bold; margin: 20px 0 10px 0;
      padding-bottom: 6px; border-bottom: 2px solid #111;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      background: #f3f4f6; padding: 10px 8px; text-align: left;
      font-size: 11px; font-weight: bold; color: #6b7280;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    th.right { text-align: right; }
    th.center { text-align: center; }
    .divider { border: none; border-top: 1px dashed #d1d5db; margin: 16px 0; }
    .summary-grid {
      display: grid; grid-template-columns: repeat(4,1fr);
      gap: 12px; margin-bottom: 8px;
    }
    .summary-box {
      border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;
    }
    .summary-label {
      font-size: 10px; color: #6b7280; text-transform: uppercase;
      letter-spacing: 0.05em; margin-bottom: 4px;
    }
    .summary-value { font-size: 16px; font-weight: bold; color: #111; }
    .summary-sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .grand-total {
      display: flex; justify-content: space-between; align-items: center;
      background: #111; color: #fff; padding: 14px 16px;
      border-radius: 8px; margin-top: 20px;
    }
    .footer {
      margin-top: 30px; text-align: center; font-size: 10px;
      color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px;
    }
    .no-data {
      text-align: center; color: #9ca3af;
      padding: 20px; font-size: 12px;
    }
    @media print { body { padding: 15mm 12mm; } }
  `;

  const buildPageHeader = (title, subtitle) => `
    <div style="display: flex; justify-content: space-between;
                align-items: flex-start; margin-bottom: 20px;">
      <div>
        <h1>${activeBusiness?.name || "Business"}</h1>
        <p style="color: #6b7280; font-size: 12px; margin-top: 2px;">
          ${activeBusiness?.location || ""}
          ${activeBusiness?.country ? ` • ${activeBusiness.country}` : ""}
        </p>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 11px; color: #6b7280;">Generated on</p>
        <p style="font-size: 12px; font-weight: bold; color: #111;">
          ${new Date().toLocaleDateString("en-US", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </p>
      </div>
    </div>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb;
                border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="font-size: 11px; color: #6b7280; text-transform: uppercase;
                letter-spacing: 0.05em; margin-bottom: 4px;">
        ${title}
      </p>
      <p style="font-size: 18px; font-weight: bold; color: #111;">
        ${subtitle}
      </p>
    </div>
  `;

  const openPrintWindow = (html) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  // ─────────────────────────────────────────
  // PRINT DAILY REPORT
  // ─────────────────────────────────────────
  const printDailyReport = (selected) => {
    if (!daily) return;

    const formatPrint = (amount) =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);

    const formattedDate = new Date(selectedDate).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric",
      month: "long", day: "numeric",
    });

    // Build product map from transactions
    const productMap = {};
    daily.transactions?.forEach((transaction) => {
      transaction.items?.forEach((item) => {
        const key = item.product?.id || item.productId;
        if (!productMap[key]) {
          productMap[key] = {
            name: item.product?.name || "Unknown",
            unit: item.product?.unit || "",
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        productMap[key].totalQuantity += item.quantitySold;
        productMap[key].totalRevenue += item.subtotal;
      });
    });
    const productRows = Object.values(productMap);

    // ── Summary Section ──
    const summaryHTML = selected.summary ? `
      <div class="summary-grid">
        <div class="summary-box">
          <div class="summary-label">Total Sales</div>
          <div class="summary-value">
            ${currency} ${formatPrint(daily.summary?.totalAmount)}
          </div>
          <div class="summary-sub">
            ${daily.summary?.totalTransactions} transactions
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Cash</div>
          <div class="summary-value" style="color: #16a34a;">
            ${currency} ${formatPrint(daily.summary?.cashTotal)}
          </div>
          <div class="summary-sub">
            ${daily.summary?.cashTransactions} transactions
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Transfer</div>
          <div class="summary-value" style="color: #2563eb;">
            ${currency} ${formatPrint(daily.summary?.transferTotal)}
          </div>
          <div class="summary-sub">
            ${daily.summary?.transferTransactions} transactions
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Products Sold</div>
          <div class="summary-value" style="color: #7c3aed;">
            ${productRows.length}
          </div>
          <div class="summary-sub">unique products</div>
        </div>
      </div>
      <hr class="divider" />
    ` : "";

    // ── Items Sold Section ──
    const itemsSoldHTML = selected.itemsSold ? `
      <h2>Items Sold</h2>
      ${productRows.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th class="center">Quantity Sold</th>
              <th class="right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${productRows.map((p, index) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 8px; font-size: 13px; color: #111;">
                  ${index + 1}. ${p.name}
                </td>
                <td style="padding: 10px 8px; text-align: center;
                           font-size: 13px; color: #111;">
                  ${p.totalQuantity} ${p.unit}
                </td>
                <td style="padding: 10px 8px; text-align: right;
                           font-size: 13px; color: #111; font-weight: bold;">
                  ${currency} ${formatPrint(p.totalRevenue)}
                </td>
              </tr>
            `).join("")}
            <tr style="background: #f9fafb;">
              <td style="padding: 10px 8px; font-size: 13px;">
                <strong>Total</strong>
              </td>
              <td style="padding: 10px 8px; text-align: center; font-size: 13px;">
                <strong>
                  ${productRows.reduce((s, p) => s + p.totalQuantity, 0)} units
                </strong>
              </td>
              <td style="padding: 10px 8px; text-align: right; font-size: 13px;">
                <strong>
                  ${currency} ${formatPrint(daily.summary?.totalAmount)}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      ` : `<p class="no-data">No items sold on this day</p>`}
      <hr class="divider" />
    ` : "";

    // ── Transaction Log Section ──
    const transactionLogHTML = selected.transactionLog ? `
      <h2>Transaction Log</h2>
      ${daily.transactions?.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Customer</th>
              <th>Served By</th>
              <th class="center">Payment</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${daily.transactions.map((t, index) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px; font-size: 12px; color: #374151;">
                  ${index + 1}.
                  ${new Date(t.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                <td style="padding: 8px; font-size: 12px; color: #374151;">
                  ${t.customerName || "Casual Customer"}
                </td>
                <td style="padding: 8px; font-size: 12px; color: #374151;">
                  ${t.performedBy?.fullName || ""}
                </td>
                <td style="padding: 8px; font-size: 12px; color: #374151;
                           text-align: center;">
                  ${t.paymentMethod}
                </td>
                <td style="padding: 8px; font-size: 12px; color: #111;
                           font-weight: bold; text-align: right;">
                  ${currency} ${formatPrint(t.totalAmount)}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `<p class="no-data">No transactions on this day</p>`}
      <hr class="divider" />
    ` : "";

    // ── Employee Breakdown Section ──
    const employeeHTML = selected.employeeBreakdown &&
      daily.byEmployee?.length > 0 ? `
      <h2>Sales by Employee</h2>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th class="center">Transactions</th>
            <th class="right">Cash</th>
            <th class="right">Transfer</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${daily.byEmployee.map((emp) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px; font-size: 12px; color: #374151;">
                ${emp.employee?.fullName || ""}
              </td>
              <td style="padding: 8px; font-size: 12px; color: #374151;
                         text-align: center;">
                ${emp.transactionCount}
              </td>
              <td style="padding: 8px; font-size: 12px; color: #374151;
                         text-align: right;">
                ${currency} ${formatPrint(emp.cashAmount)}
              </td>
              <td style="padding: 8px; font-size: 12px; color: #374151;
                         text-align: right;">
                ${currency} ${formatPrint(emp.transferAmount)}
              </td>
              <td style="padding: 8px; font-size: 12px; font-weight: bold;
                         color: #111; text-align: right;">
                ${currency} ${formatPrint(emp.totalAmount)}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <hr class="divider" />
    ` : "";

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Daily Report - ${formattedDate}</title>
          <style>${sharedStyles}</style>
        </head>
        <body>
          ${buildPageHeader("Daily Sales Report", formattedDate)}
          ${summaryHTML}
          ${itemsSoldHTML}
          ${transactionLogHTML}
          ${employeeHTML}
          <div class="grand-total">
            <span style="font-size: 15px; font-weight: bold;">
              TOTAL REVENUE — ${formattedDate}
            </span>
            <span style="font-size: 20px; font-weight: bold;">
              ${currency} ${formatPrint(daily.summary?.totalAmount)}
            </span>
          </div>
          <div class="footer">
            <p>
              Report generated by BizManager •
              ${new Date().toLocaleString("en-US")}
            </p>
          </div>
        </body>
      </html>
    `;

    openPrintWindow(reportHTML);
  };

  // ─────────────────────────────────────────
  // PRINT WEEKLY REPORT
  // ─────────────────────────────────────────
  const printWeeklyReport = (selected) => {
    if (!weekly) return;

    const formatPrint = (amount) =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);

    // ── Summary ──
    const summaryHTML = selected.summary ? `
      <div class="summary-grid">
        <div class="summary-box">
          <div class="summary-label">Weekly Total</div>
          <div class="summary-value">
            ${currency} ${formatPrint(weekly.summary?.totalAmount)}
          </div>
          <div class="summary-sub">
            ${weekly.summary?.totalTransactions} transactions
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Cash</div>
          <div class="summary-value" style="color: #16a34a;">
            ${currency} ${formatPrint(weekly.summary?.cashTotal)}
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Transfer</div>
          <div class="summary-value" style="color: #2563eb;">
            ${currency} ${formatPrint(weekly.summary?.transferTotal)}
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Best Day</div>
          <div class="summary-value" style="font-size: 14px;">
            ${weekly.summary?.bestDay?.dayName || "N/A"}
          </div>
          <div class="summary-sub">
            ${currency} ${formatPrint(weekly.summary?.bestDay?.totalAmount)}
          </div>
        </div>
      </div>
      <hr class="divider" />
    ` : "";

    // ── Daily Breakdown ──
    const dailyBreakdownHTML = selected.transactionLog ? `
      <h2>Daily Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th class="center">Transactions</th>
            <th class="right">Cash</th>
            <th class="right">Transfer</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${weekly.dailyBreakdown?.map((day) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 8px; font-size: 13px; color: #374151;">
                ${day.dayName}
              </td>
              <td style="padding: 10px 8px; font-size: 13px;
                         color: #374151; text-align: center;">
                ${day.transactionCount}
              </td>
              <td style="padding: 10px 8px; font-size: 13px;
                         color: #16a34a; text-align: right;">
                ${currency} ${formatPrint(day.cashTotal)}
              </td>
              <td style="padding: 10px 8px; font-size: 13px;
                         color: #2563eb; text-align: right;">
                ${currency} ${formatPrint(day.transferTotal)}
              </td>
              <td style="padding: 10px 8px; font-size: 13px;
                         font-weight: bold; color: #111; text-align: right;">
                ${currency} ${formatPrint(day.totalAmount)}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <hr class="divider" />
    ` : "";

    // ── Top Products ──
    const productsHTML = selected.itemsSold &&
      weekly.byProduct?.length > 0 ? `
      <h2>Products Sold</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th class="center">Quantity Sold</th>
            <th class="right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${weekly.byProduct.map((p, index) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 8px; font-size: 13px; color: #111;">
                ${index + 1}. ${p.product?.name}
              </td>
              <td style="padding: 10px 8px; text-align: center;
                         font-size: 13px; color: #111;">
                ${p.totalQuantity} ${p.product?.unit}
              </td>
              <td style="padding: 10px 8px; text-align: right;
                         font-size: 13px; font-weight: bold; color: #111;">
                ${currency} ${formatPrint(p.totalRevenue)}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <hr class="divider" />
    ` : "";

    // ── Employee Breakdown ──
    const employeeHTML = selected.employeeBreakdown &&
      weekly.byEmployee?.length > 0 ? `
      <h2>Sales by Employee</h2>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th class="center">Transactions</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${weekly.byEmployee.map((emp) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px; font-size: 12px; color: #374151;">
                ${emp.employee?.fullName || ""}
              </td>
              <td style="padding: 8px; font-size: 12px; color: #374151;
                         text-align: center;">
                ${emp.transactionCount}
              </td>
              <td style="padding: 8px; font-size: 12px; font-weight: bold;
                         color: #111; text-align: right;">
                ${currency} ${formatPrint(emp.totalAmount)}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <hr class="divider" />
    ` : "";

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Weekly Report - ${weekly.weekStart} to ${weekly.weekEnd}</title>
          <style>${sharedStyles}</style>
        </head>
        <body>
          ${buildPageHeader(
            "Weekly Sales Report",
            `${weekly.weekStart} — ${weekly.weekEnd}`
          )}
          ${summaryHTML}
          ${dailyBreakdownHTML}
          ${productsHTML}
          ${employeeHTML}
          <div class="grand-total">
            <span style="font-size: 15px; font-weight: bold;">
              TOTAL REVENUE — Week of ${weekly.weekStart}
            </span>
            <span style="font-size: 20px; font-weight: bold;">
              ${currency} ${formatPrint(weekly.summary?.totalAmount)}
            </span>
          </div>
          <div class="footer">
            <p>
              Report generated by BizManager •
              ${new Date().toLocaleString("en-US")}
            </p>
          </div>
        </body>
      </html>
    `;

    openPrintWindow(reportHTML);
  };

  // ─────────────────────────────────────────
  // PRINT MONTHLY REPORT
  // ─────────────────────────────────────────
  const printMonthlyReport = (selected) => {
    if (!monthly) return;

    const formatPrint = (amount) =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);

    // ── Summary ──
    const summaryHTML = selected.summary ? `
      <div class="summary-grid">
        <div class="summary-box">
          <div class="summary-label">Monthly Total</div>
          <div class="summary-value">
            ${currency} ${formatPrint(monthly.summary?.totalAmount)}
          </div>
          <div class="summary-sub">
            ${monthly.summary?.totalTransactions} transactions
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Daily Average</div>
          <div class="summary-value" style="font-size: 14px;">
            ${currency} ${formatPrint(monthly.summary?.avgDailySales)}
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Cash Total</div>
          <div class="summary-value" style="color: #16a34a;">
            ${currency} ${formatPrint(monthly.summary?.cashTotal)}
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Best Day</div>
          <div class="summary-value" style="font-size: 13px;">
            ${monthly.summary?.bestDay?.date || "N/A"}
          </div>
          <div class="summary-sub">
            ${currency} ${formatPrint(monthly.summary?.bestDay?.totalAmount)}
          </div>
        </div>
      </div>
      <hr class="divider" />
    ` : "";

    // ── Daily Breakdown ──
    const dailyBreakdownHTML = selected.transactionLog ? `
      <h2>Daily Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th class="center">Transactions</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${monthly.dailyBreakdown
            ?.filter((d) => d.transactionCount > 0)
            .map((day) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px; font-size: 12px; color: #374151;">
                  ${day.date} (${day.dayName})
                </td>
                <td style="padding: 8px; font-size: 12px;
                           color: #374151; text-align: center;">
                  ${day.transactionCount}
                </td>
                <td style="padding: 8px; font-size: 12px;
                           font-weight: bold; color: #111; text-align: right;">
                  ${currency} ${formatPrint(day.totalAmount)}
                </td>
              </tr>
            `).join("")}
        </tbody>
      </table>
      <hr class="divider" />
    ` : "";

    // ── Top Products ──
    const productsHTML = selected.itemsSold &&
      monthly.byProduct?.length > 0 ? `
      <h2>Top Products This Month</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th class="center">Quantity Sold</th>
            <th class="right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${monthly.byProduct.map((p, index) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 8px; font-size: 13px; color: #111;">
                ${index + 1}. ${p.product?.name}
              </td>
              <td style="padding: 10px 8px; text-align: center;
                         font-size: 13px; color: #111;">
                ${p.totalQuantity} ${p.product?.unit}
              </td>
              <td style="padding: 10px 8px; text-align: right;
                         font-size: 13px; font-weight: bold; color: #111;">
                ${currency} ${formatPrint(p.totalRevenue)}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <hr class="divider" />
    ` : "";

    // ── Employee Breakdown ──
    const employeeHTML = selected.employeeBreakdown &&
      monthly.byEmployee?.length > 0 ? `
      <h2>Sales by Employee</h2>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th class="center">Transactions</th>
            <th class="right">Cash</th>
            <th class="right">Transfer</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${monthly.byEmployee.map((emp) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px; font-size: 12px; color: #374151;">
                ${emp.employee?.fullName || ""}
              </td>
              <td style="padding: 8px; font-size: 12px; color: #374151;
                         text-align: center;">
                ${emp.transactionCount}
              </td>
              <td style="padding: 8px; font-size: 12px; color: #374151;
                         text-align: right;">
                ${currency} ${formatPrint(emp.cashAmount)}
              </td>
              <td style="padding: 8px; font-size: 12px; color: #374151;
                         text-align: right;">
                ${currency} ${formatPrint(emp.transferAmount)}
              </td>
              <td style="padding: 8px; font-size: 12px; font-weight: bold;
                         color: #111; text-align: right;">
                ${currency} ${formatPrint(emp.totalAmount)}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <hr class="divider" />
    ` : "";

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Monthly Report - ${monthly.month}</title>
          <style>${sharedStyles}</style>
        </head>
        <body>
          ${buildPageHeader("Monthly Sales Report", monthly.month)}
          ${summaryHTML}
          ${dailyBreakdownHTML}
          ${productsHTML}
          ${employeeHTML}
          <div class="grand-total">
            <span style="font-size: 15px; font-weight: bold;">
              TOTAL REVENUE — ${monthly.month}
            </span>
            <span style="font-size: 20px; font-weight: bold;">
              ${currency} ${formatPrint(monthly.summary?.totalAmount)}
            </span>
          </div>
          <div class="footer">
            <p>
              Report generated by BizManager •
              ${new Date().toLocaleString("en-US")}
            </p>
          </div>
        </body>
      </html>
    `;

    openPrintWindow(reportHTML);
  };

  // ─────────────────────────────────────────
  // HANDLE PRINT DISPATCH
  // ─────────────────────────────────────────
  const handlePrint = (selected) => {
    if (printModal.type === "daily") printDailyReport(selected);
    if (printModal.type === "weekly") printWeeklyReport(selected);
    if (printModal.type === "monthly") printMonthlyReport(selected);
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div>
      {/* Print Options Modal */}
      <PrintOptionsModal
        isOpen={printModal.open}
        onClose={() => setPrintModal({ open: false, type: null })}
        onPrint={handlePrint}
        reportType={printModal.type}
      />

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
                        text-sm font-medium whitespace-nowrap transition-colors
                        ${
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
          {/* Date Picker + Print Button */}
          <div className="flex items-center justify-between flex-wrap gap-3">
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
                  weekday: "long", year: "numeric",
                  month: "long", day: "numeric",
                })}
              </span>
            </div>
            {daily.summary?.totalTransactions > 0 && (
              <button
                onClick={() =>
                  setPrintModal({ open: true, type: "daily" })
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                           border border-dark-600 hover:border-primary-500
                           hover:bg-primary-500/10 transition-all duration-200
                           group"
              >
                <Printer
                  size={16}
                  className="text-dark-400 group-hover:text-primary-400
                             transition-colors"
                />
                <span className="text-dark-400 group-hover:text-primary-400
                                 text-sm font-medium transition-colors">
                  Print Report
                </span>
              </button>
            )}
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
                          Cash: {currency} {formatAmount(emp.cashAmount)}
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

          {daily.summary?.totalTransactions === 0 && (
            <div className="card p-12 text-center">
              <BarChart3 size={40} className="text-dark-600 mx-auto mb-4" />
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
          {/* Date Picker + Print Button */}
          <div className="flex items-center justify-between flex-wrap gap-3">
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
            {weekly.summary?.totalTransactions > 0 && (
              <button
                onClick={() =>
                  setPrintModal({ open: true, type: "weekly" })
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                           border border-dark-600 hover:border-primary-500
                           hover:bg-primary-500/10 transition-all duration-200
                           group"
              >
                <Printer
                  size={16}
                  className="text-dark-400 group-hover:text-primary-400
                             transition-colors"
                />
                <span className="text-dark-400 group-hover:text-primary-400
                                 text-sm font-medium transition-colors">
                  Print Report
                </span>
              </button>
            )}
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

          {/* Chart */}
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
          {/* Month/Year Picker + Print Button */}
          <div className="flex items-center justify-between flex-wrap gap-3">
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
            {monthly.summary?.totalTransactions > 0 && (
              <button
                onClick={() =>
                  setPrintModal({ open: true, type: "monthly" })
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                           border border-dark-600 hover:border-primary-500
                           hover:bg-primary-500/10 transition-all duration-200
                           group"
              >
                <Printer
                  size={16}
                  className="text-dark-400 group-hover:text-primary-400
                             transition-colors"
                />
                <span className="text-dark-400 group-hover:text-primary-400
                                 text-sm font-medium transition-colors">
                  Print Report
                </span>
              </button>
            )}
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

          {/* Chart */}
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

          {/* Top Products */}
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
                    {currency} {formatAmount(emp.summary?.totalAmount)}
                  </p>
                  <p className="text-dark-400 text-sm">
                    {emp.summary?.transactionCount} transactions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-dark-800 rounded-lg p-3 flex items-center gap-2">
                  <Banknote size={16} className="text-green-400" />
                  <div>
                    <p className="text-dark-400 text-xs">Cash</p>
                    <p className="text-green-400 font-medium text-sm">
                      {currency} {formatAmount(emp.summary?.cashTotal)}
                    </p>
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-400" />
                  <div>
                    <p className="text-dark-400 text-xs">Transfer</p>
                    <p className="text-blue-400 font-medium text-sm">
                      {currency} {formatAmount(emp.summary?.transferTotal)}
                    </p>
                  </div>
                </div>
              </div>

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
                        className="flex items-center justify-between text-sm"
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
      )}

      {/* ─── PRODUCT REPORT ─── */}
      {activeTab === "products" && productReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Total Products Sold</p>
              <p className="text-white text-2xl font-bold">
                {productReport.totalProducts}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Top Earner</p>
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
                      Avg {currency} {formatAmount(p.avgUnitPrice)}/unit
                    </p>
                  </div>
                </div>
              ))}
              {productReport.bestSelling?.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-dark-400">No product sales data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── STOCK ALERTS ─── */}
      {activeTab === "stock" && stockReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Out of Stock</p>
              <p className="text-red-400 text-2xl font-bold">
                {stockReport.summary?.outOfStockCount}
              </p>
              <p className="text-dark-500 text-xs mt-1">items</p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Low Stock</p>
              <p className="text-yellow-400 text-2xl font-bold">
                {stockReport.summary?.lowStockCount}
              </p>
              <p className="text-dark-500 text-xs mt-1">items</p>
            </div>
            <div className="card p-4">
              <p className="text-dark-400 text-xs mb-1">Healthy</p>
              <p className="text-green-400 text-2xl font-bold">
                {stockReport.summary?.healthyCount}
              </p>
              <p className="text-dark-500 text-xs mt-1">items</p>
            </div>
          </div>

          {stockReport.outOfStock?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-dark-700
                              flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                <h3 className="text-white font-semibold">Out of Stock</h3>
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
                    <span className="badge-red">
                      0 {item.product?.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stockReport.lowStock?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-dark-700
                              flex items-center gap-2">
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