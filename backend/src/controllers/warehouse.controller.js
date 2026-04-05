const {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  setPrimaryWarehouse,
  updateWarehouse,
  deleteWarehouse,
} = require("../services/warehouse.service");
const { sendSuccess, sendError } = require("../utils/response.utils");

/**
 * POST /api/businesses/:businessId/warehouses
 */
const create = async (req, res) => {
  try {
    const { name, location, isPrimary } = req.body;
    const { businessId } = req.params;

    if (!name) {
      return sendError(res, {
        message: "Warehouse name is required",
        statusCode: 400,
      });
    }

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
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not create warehouse",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/warehouses
 */
const getAll = async (req, res) => {
  try {
    const warehouses = await getWarehouses(req.params.businessId);

    return sendSuccess(res, {
      message: "Warehouses fetched successfully",
      data: warehouses,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch warehouses",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/warehouses/:warehouseId
 */
const getOne = async (req, res) => {
  try {
    const warehouse = await getWarehouseById(
      req.params.warehouseId,
      req.params.businessId
    );

    return sendSuccess(res, {
      message: "Warehouse fetched successfully",
      data: warehouse,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch warehouse",
      statusCode: 404,
    });
  }
};

/**
 * PATCH /api/businesses/:businessId/warehouses/:warehouseId/primary
 */
const setPrimary = async (req, res) => {
  try {
    const warehouse = await setPrimaryWarehouse(
      req.params.warehouseId,
      req.params.businessId
    );

    return sendSuccess(res, {
      message: "Primary warehouse updated successfully",
      data: warehouse,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not update primary warehouse",
      statusCode: 400,
    });
  }
};

/**
 * PATCH /api/businesses/:businessId/warehouses/:warehouseId
 */
const update = async (req, res) => {
  try {
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
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not update warehouse",
      statusCode: 400,
    });
  }
};

/**
 * DELETE /api/businesses/:businessId/warehouses/:warehouseId
 */
const remove = async (req, res) => {
  try {
    const result = await deleteWarehouse(
      req.params.warehouseId,
      req.params.businessId
    );

    return sendSuccess(res, {
      message: result.message,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not delete warehouse",
      statusCode: 400,
    });
  }
};

module.exports = { create, getAll, getOne, setPrimary, update, remove };