const {
  createTransaction,
  getTransactions,
  getTransactionById,
  getTransactionSummary,
} = require("../services/transaction.service");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * POST /api/businesses/:businessId/transactions
 * Make a sale
 */
const create = asyncHandler(async (req, res) => {
  const { paymentMethod, items, notes, customerName } = req.body;

  const transaction = await createTransaction({
    businessId: req.params.businessId,
    performedById: req.user.id,
    paymentMethod,
    customerName,
    items,
    notes,
  });

  return sendSuccess(res, {
    message: "Sale recorded successfully",
    data: transaction,
    statusCode: 201,
  });
});

/**
 * GET /api/businesses/:businessId/transactions
 * Get all transactions with optional filters
 */
const getAll = asyncHandler(async (req, res) => {
  const {
    performedById,
    paymentMethod,
    startDate,
    endDate,
    page,
    limit,
  } = req.validatedQuery;

  const result = await getTransactions({
    businessId: req.params.businessId,
    performedById,
    paymentMethod,
    startDate,
    endDate,
    page: page || 1,
    limit: limit || 20,
  });

  return sendSuccess(res, {
    message: "Transactions fetched successfully",
    data: result,
  });
});

/**
 * GET /api/businesses/:businessId/transactions/summary
 * Get transaction summary for dashboard
 */
const getSummary = asyncHandler(async (req, res) => {
  const summary = await getTransactionSummary(req.params.businessId);

  return sendSuccess(res, {
    message: "Transaction summary fetched successfully",
    data: summary,
  });
});

/**
 * GET /api/businesses/:businessId/transactions/:transactionId
 * Get a single transaction
 */
const getOne = asyncHandler(async (req, res) => {
  const transaction = await getTransactionById(
    req.params.transactionId,
    req.params.businessId
  );

  return sendSuccess(res, {
    message: "Transaction fetched successfully",
    data: transaction,
  });
});

module.exports = { create, getAll, getSummary, getOne };
