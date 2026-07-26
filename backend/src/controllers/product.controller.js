const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  receiveStock,
  getAllStock,
  moveStock,
  getStockMovements,
} = require("../services/product.service");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * POST /api/businesses/:businessId/products
 */
const create = asyncHandler(async (req, res) => {
  const { name, unit, price, description, shortCode } = req.body;

  const product = await createProduct({
    businessId: req.params.businessId,
    name,
    unit,
    price,
    description,
    shortCode,
  });

  return sendSuccess(res, {
    message: "Product created successfully",
    data: product,
    statusCode: 201,
  });
});

/**
 * GET /api/businesses/:businessId/products
 */
const getAll = asyncHandler(async (req, res) => {
  const products = await getProducts(req.params.businessId);

  return sendSuccess(res, {
    message: "Products fetched successfully",
    data: products,
  });
});

/**
 * GET /api/businesses/:businessId/products/:productId
 */
const getOne = asyncHandler(async (req, res) => {
  const product = await getProductById(
    req.params.productId,
    req.params.businessId
  );

  return sendSuccess(res, {
    message: "Product fetched successfully",
    data: product,
  });
});

/**
 * PATCH /api/businesses/:businessId/products/:productId
 */
const update = asyncHandler(async (req, res) => {
  const { name, unit, price, description, shortCode } = req.body;

  const product = await updateProduct(
    req.params.productId,
    req.params.businessId,
    { name, unit, price, description, shortCode }
  );

  return sendSuccess(res, {
    message: "Product updated successfully",
    data: product,
  });
});

/**
 * DELETE /api/businesses/:businessId/products/:productId
 */
const remove = asyncHandler(async (req, res) => {
  const result = await deleteProduct(
    req.params.productId,
    req.params.businessId
  );

  return sendSuccess(res, {
    message: result.message,
  });
});

/**
 * POST /api/businesses/:businessId/stock/receive
 * Receive incoming stock (a restock/delivery) into one warehouse for one or more products
 */
const receiveStockController = asyncHandler(async (req, res) => {
  const { warehouseId, items, notes } = req.body;
  const { businessId } = req.params;

  const movements = await receiveStock({
    businessId,
    warehouseId,
    items,
    movedById: req.user.id,
    notes,
  });

  return sendSuccess(res, {
    message: "Stock received successfully",
    data: movements,
    statusCode: 201,
  });
});

/**
 * GET /api/businesses/:businessId/stock
 * Get all stock across all warehouses
 */
const getStock = asyncHandler(async (req, res) => {
  const stock = await getAllStock(req.params.businessId);

  return sendSuccess(res, {
    message: "Stock fetched successfully",
    data: stock,
  });
});

/**
 * POST /api/businesses/:businessId/stock/move
 * Move stock between warehouses
 */
const moveStockBetweenWarehouses = asyncHandler(async (req, res) => {
  const { fromWarehouseId, toWarehouseId, productId, quantity, notes } = req.body;
  const { businessId } = req.params;

  const movement = await moveStock({
    businessId,
    fromWarehouseId,
    toWarehouseId,
    productId,
    quantity,
    movedById: req.user.id,
    notes,
  });

  return sendSuccess(res, {
    message: "Stock moved successfully",
    data: movement,
    statusCode: 201,
  });
});

/**
 * GET /api/businesses/:businessId/stock/movements
 * Get stock movement history
 */
const getMovements = asyncHandler(async (req, res) => {
  const movements = await getStockMovements(req.params.businessId);

  return sendSuccess(res, {
    message: "Stock movements fetched successfully",
    data: movements,
  });
});

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
  receiveStockController,
  getStock,
  moveStockBetweenWarehouses,
  getMovements,
};
