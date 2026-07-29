const {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getEmployeeReport,
  getProductReport,
  getStockAlertReport,
} = require("../services/report.service");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/businesses/:businessId/reports/daily
 * Full sales breakdown for a single day (transactions, revenue, etc.).
 * Query params: date (optional, defaults to today)
 */
const daily = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const report = await getDailyReport(req.params.businessId, date);

  return sendSuccess(res, {
    message: "Daily report fetched successfully",
    data: report,
  });
});

/**
 * GET /api/businesses/:businessId/reports/weekly
 * Sales breakdown for the week containing the given date, with a per-day
 * summary within that week.
 * Query params: date (optional, any date in the week)
 */
const weekly = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const report = await getWeeklyReport(req.params.businessId, date);

  return sendSuccess(res, {
    message: "Weekly report fetched successfully",
    data: report,
  });
});

/**
 * GET /api/businesses/:businessId/reports/monthly
 * Sales breakdown for a calendar month, with a per-week summary within it.
 * Query params: year, month (optional, defaults to current month)
 */
const monthly = asyncHandler(async (req, res) => {
  const { year, month } = req.query;

  const report = await getMonthlyReport(req.params.businessId, year, month);

  return sendSuccess(res, {
    message: "Monthly report fetched successfully",
    data: report,
  });
});

/**
 * GET /api/businesses/:businessId/reports/employees
 * Per-employee performance breakdown (sales made, revenue generated) over
 * an optional date range, for spotting top/underperforming staff.
 * Query params: startDate, endDate (optional)
 */
const employees = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const report = await getEmployeeReport(req.params.businessId, startDate, endDate);

  return sendSuccess(res, {
    message: "Employee report fetched successfully",
    data: report,
  });
});

/**
 * GET /api/businesses/:businessId/reports/products
 * Per-product sales performance (units sold, revenue) over an optional date
 * range, for spotting best/worst sellers.
 * Query params: startDate, endDate (optional)
 */
const products = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const report = await getProductReport(req.params.businessId, startDate, endDate);

  return sendSuccess(res, {
    message: "Product report fetched successfully",
    data: report,
  });
});

/**
 * GET /api/businesses/:businessId/reports/stock
 * Stock alerts - low stock and out of stock
 */
const stockAlerts = asyncHandler(async (req, res) => {
  const report = await getStockAlertReport(req.params.businessId);

  return sendSuccess(res, {
    message: "Stock alert report fetched successfully",
    data: report,
  });
});

module.exports = { daily, weekly, monthly, employees, products, stockAlerts };
