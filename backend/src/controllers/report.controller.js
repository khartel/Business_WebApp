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
