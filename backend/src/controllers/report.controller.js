const {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getEmployeeReport,
  getProductReport,
  getStockAlertReport,
} = require("../services/report.service");
const { sendSuccess, sendError } = require("../utils/response.utils");

/**
 * GET /api/businesses/:businessId/reports/daily
 * Query params: date (optional, defaults to today)
 */
const daily = async (req, res) => {
  try {
    const { date } = req.query;

    const report = await getDailyReport(req.params.businessId, date);

    return sendSuccess(res, {
      message: "Daily report fetched successfully",
      data: report,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch daily report",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/reports/weekly
 * Query params: date (optional, any date in the week)
 */
const weekly = async (req, res) => {
  try {
    const { date } = req.query;

    const report = await getWeeklyReport(req.params.businessId, date);

    return sendSuccess(res, {
      message: "Weekly report fetched successfully",
      data: report,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch weekly report",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/reports/monthly
 * Query params: year, month (optional, defaults to current month)
 */
const monthly = async (req, res) => {
  try {
    const { year, month } = req.query;

    const report = await getMonthlyReport(
      req.params.businessId,
      year ? parseInt(year) : null,
      month ? parseInt(month) : null
    );

    return sendSuccess(res, {
      message: "Monthly report fetched successfully",
      data: report,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch monthly report",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/reports/employees
 * Query params: startDate, endDate (optional)
 */
const employees = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const report = await getEmployeeReport(
      req.params.businessId,
      startDate,
      endDate
    );

    return sendSuccess(res, {
      message: "Employee report fetched successfully",
      data: report,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch employee report",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/reports/products
 * Query params: startDate, endDate (optional)
 */
const products = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const report = await getProductReport(
      req.params.businessId,
      startDate,
      endDate
    );

    return sendSuccess(res, {
      message: "Product report fetched successfully",
      data: report,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch product report",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/reports/stock
 * Stock alerts - low stock and out of stock
 */
const stockAlerts = async (req, res) => {
  try {
    const report = await getStockAlertReport(req.params.businessId);

    return sendSuccess(res, {
      message: "Stock alert report fetched successfully",
      data: report,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch stock alert report",
      statusCode: 400,
    });
  }
};

module.exports = { daily, weekly, monthly, employees, products, stockAlerts };