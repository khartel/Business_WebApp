const {
  createTransaction,
  getTransactions,
  getTransactionById,
  getTransactionSummary,
} = require("../services/transaction.service");
const { sendSuccess, sendError } = require("../utils/response.utils");

/**
 * POST /api/businesses/:businessId/transactions
 * Make a sale
 */
const create = async (req, res) => {
  try {
    const { paymentMethod, items, notes, customerName } = req.body;

    if (!paymentMethod) {
      return sendError(res, {
        message: "Payment method is required",
        statusCode: 400,
      });
    }

    if (!["CASH", "TRANSFER"].includes(paymentMethod)) {
      return sendError(res, {
        message: "Payment method must be CASH or TRANSFER",
        statusCode: 400,
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, {
        message: "At least one item is required",
        statusCode: 400,
      });
    }

    for (const item of items) {
      if (!item.productId || !item.quantitySold || !item.unitPrice) {
        return sendError(res, {
          message: "Each item must have productId, quantitySold and unitPrice",
          statusCode: 400,
        });
      }
    }

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
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not record sale",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/transactions
 * Get all transactions with optional filters
 */
const getAll = async (req, res) => {
  try {
    const {
      performedById,
      paymentMethod,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const result = await getTransactions({
      businessId: req.params.businessId,
      performedById,
      paymentMethod,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    return sendSuccess(res, {
      message: "Transactions fetched successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch transactions",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/transactions/summary
 * Get transaction summary for dashboard
 */
const getSummary = async (req, res) => {
  try {
    const summary = await getTransactionSummary(req.params.businessId);

    return sendSuccess(res, {
      message: "Transaction summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch summary",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/transactions/:transactionId
 * Get a single transaction
 */
const getOne = async (req, res) => {
  try {
    const transaction = await getTransactionById(
      req.params.transactionId,
      req.params.businessId
    );

    return sendSuccess(res, {
      message: "Transaction fetched successfully",
      data: transaction,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch transaction",
      statusCode: 404,
    });
  }
};

module.exports = { create, getAll, getSummary, getOne };