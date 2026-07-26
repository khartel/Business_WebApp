const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../services/customer.service");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * POST /api/businesses/:businessId/customers
 */
const create = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const customer = await createCustomer({
    businessId: req.params.businessId,
    name,
    phone,
  });

  return sendSuccess(res, {
    message: "Customer created successfully",
    data: customer,
    statusCode: 201,
  });
});

/**
 * GET /api/businesses/:businessId/customers
 */
const getAll = asyncHandler(async (req, res) => {
  const { search, limit } = req.validatedQuery;

  const customers = await getCustomers(req.params.businessId, { search, limit });

  return sendSuccess(res, {
    message: "Customers fetched successfully",
    data: customers,
  });
});

/**
 * GET /api/businesses/:businessId/customers/:customerId
 */
const getOne = asyncHandler(async (req, res) => {
  const customer = await getCustomerById(req.params.customerId, req.params.businessId);

  return sendSuccess(res, {
    message: "Customer fetched successfully",
    data: customer,
  });
});

/**
 * PATCH /api/businesses/:businessId/customers/:customerId
 */
const update = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const customer = await updateCustomer(req.params.customerId, req.params.businessId, {
    name,
    phone,
  });

  return sendSuccess(res, {
    message: "Customer updated successfully",
    data: customer,
  });
});

/**
 * DELETE /api/businesses/:businessId/customers/:customerId
 */
const remove = asyncHandler(async (req, res) => {
  const result = await deleteCustomer(req.params.customerId, req.params.businessId);

  return sendSuccess(res, {
    message: result.message,
  });
});

module.exports = { create, getAll, getOne, update, remove };
