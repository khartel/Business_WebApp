const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addStock,
  getAllStock,
  moveStock,
  getStockMovements,
} = require("../services/product.service");
const { sendSuccess, sendError } = require("../utils/response.utils");

/**
 * POST /api/businesses/:businessId/products
 */
const create = async (req, res) => {
  try {
    const { name, unit, price, description } = req.body;

    if (!name || !unit) {
      return sendError(res, {
        message: "Product name and unit are required",
        statusCode: 400,
      });
    }

    const product = await createProduct({
      businessId: req.params.businessId,
      name,
      unit,
      price,
      description,
    });

    return sendSuccess(res, {
      message: "Product created successfully",
      data: product,
      statusCode: 201,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not create product",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/products
 */
const getAll = async (req, res) => {
  try {
    const products = await getProducts(req.params.businessId);

    return sendSuccess(res, {
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch products",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/products/:productId
 */
const getOne = async (req, res) => {
  try {
    const product = await getProductById(
      req.params.productId,
      req.params.businessId
    );

    return sendSuccess(res, {
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch product",
      statusCode: 404,
    });
  }
};

/**
 * PATCH /api/businesses/:businessId/products/:productId
 */
const update = async (req, res) => {
  try {
    const { name, unit, price, description } = req.body;

    const product = await updateProduct(
      req.params.productId,
      req.params.businessId,
      { name, unit, price, description }
    );

    return sendSuccess(res, {
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not update product",
      statusCode: 400,
    });
  }
};

/**
 * DELETE /api/businesses/:businessId/products/:productId
 */
const remove = async (req, res) => {
  try {
    const result = await deleteProduct(
      req.params.productId,
      req.params.businessId
    );

    return sendSuccess(res, {
      message: result.message,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not delete product",
      statusCode: 400,
    });
  }
};

/**
 * POST /api/businesses/:businessId/products/:productId/stock
 * Add stock to a warehouse for a product
 */
const addStockToWarehouse = async (req, res) => {
  try {
    const { warehouseId, quantity, lowStockThreshold } = req.body;
    const { businessId, productId } = req.params;

    if (!warehouseId || !quantity) {
      return sendError(res, {
        message: "Warehouse ID and quantity are required",
        statusCode: 400,
      });
    }

    const stock = await addStock({
      productId,
      businessId,
      warehouseId,
      quantity: parseFloat(quantity),
      lowStockThreshold: lowStockThreshold ? parseFloat(lowStockThreshold) : undefined,
    });

    return sendSuccess(res, {
      message: "Stock added successfully",
      data: stock,
      statusCode: 201,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not add stock",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/stock
 * Get all stock across all warehouses
 */
const getStock = async (req, res) => {
  try {
    const stock = await getAllStock(req.params.businessId);

    return sendSuccess(res, {
      message: "Stock fetched successfully",
      data: stock,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch stock",
      statusCode: 400,
    });
  }
};

/**
 * POST /api/businesses/:businessId/stock/move
 * Move stock between warehouses
 */
const moveStockBetweenWarehouses = async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, productId, quantity, notes } = req.body;
    const { businessId } = req.params;

    if (!fromWarehouseId || !toWarehouseId || !productId || !quantity) {
      return sendError(res, {
        message: "From warehouse, to warehouse, product and quantity are required",
        statusCode: 400,
      });
    }

    const movement = await moveStock({
      businessId,
      fromWarehouseId,
      toWarehouseId,
      productId,
      quantity: parseFloat(quantity),
      movedById: req.user.id,
      notes,
    });

    return sendSuccess(res, {
      message: "Stock moved successfully",
      data: movement,
      statusCode: 201,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not move stock",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/stock/movements
 * Get stock movement history
 */
const getMovements = async (req, res) => {
  try {
    const movements = await getStockMovements(req.params.businessId);

    return sendSuccess(res, {
      message: "Stock movements fetched successfully",
      data: movements,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch stock movements",
      statusCode: 400,
    });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
  addStockToWarehouse,
  getStock,
  moveStockBetweenWarehouses,
  getMovements,
};