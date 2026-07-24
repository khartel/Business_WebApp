const {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  setPrimaryWarehouse,
  updateWarehouse,
  deleteWarehouse,
} = require("../services/warehouse.service");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * POST /api/businesses/:businessId/warehouses
 */
const create = asyncHandler(async (req, res) => {
  const { name, location, isPrimary } = req.body;
  const { businessId } = req.params;

  const warehouse = await createWarehouse({
    businessId,
    name,
    location,
    isPrimary: isPrimary || false,
    userId: req.user.id,
  });

  return sendSuccess(res, {
    message: "Warehouse created successfully",
    data: warehouse,
    statusCode: 201,
  });
});

/**
 * GET /api/businesses/:businessId/warehouses
 */
const getAll = asyncHandler(async (req, res) => {
  const warehouses = await getWarehouses(req.params.businessId);

  return sendSuccess(res, {
    message: "Warehouses fetched successfully",
    data: warehouses,
  });
});

/**
 * GET /api/businesses/:businessId/warehouses/:warehouseId
 */
const getOne = asyncHandler(async (req, res) => {
  const warehouse = await getWarehouseById(
    req.params.warehouseId,
    req.params.businessId
  );

  return sendSuccess(res, {
    message: "Warehouse fetched successfully",
    data: warehouse,
  });
});

/**
 * PATCH /api/businesses/:businessId/warehouses/:warehouseId/primary
 */
const setPrimary = asyncHandler(async (req, res) => {
  const warehouse = await setPrimaryWarehouse(
    req.params.warehouseId,
    req.params.businessId
  );

  return sendSuccess(res, {
    message: "Primary warehouse updated successfully",
    data: warehouse,
  });
});

/**
 * PATCH /api/businesses/:businessId/warehouses/:warehouseId
 */
const update = asyncHandler(async (req, res) => {
  const { name, location } = req.body;

  const warehouse = await updateWarehouse(
    req.params.warehouseId,
    req.params.businessId,
    { name, location }
  );

  return sendSuccess(res, {
    message: "Warehouse updated successfully",
    data: warehouse,
  });
});

/**
 * DELETE /api/businesses/:businessId/warehouses/:warehouseId
 */
const remove = asyncHandler(async (req, res) => {
  const result = await deleteWarehouse(
    req.params.warehouseId,
    req.params.businessId
  );

  return sendSuccess(res, {
    message: result.message,
  });
});

module.exports = { create, getAll, getOne, setPrimary, update, remove };
