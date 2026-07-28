const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");
const { startOfDay, endOfDay } = require("date-fns");

/**
 * Ensure a short code isn't already used by another product in this business
 */
const assertShortCodeAvailable = async (businessId, shortCode, excludeProductId) => {
  if (!shortCode) return;

  const existing = await prisma.product.findFirst({
    where: {
      businessId,
      shortCode: { equals: shortCode, mode: "insensitive" },
      ...(excludeProductId && { NOT: { id: excludeProductId } }),
    },
  });

  if (existing) {
    throw new AppError(`Short code "${shortCode}" is already used by another product`, 409);
  }
};

/**
 * Create a new product for a business
 */
const createProduct = async ({ businessId, name, unit, price, description, shortCode }) => {
  const existing = await prisma.product.findFirst({
    where: {
      businessId,
      name: { equals: name, mode: "insensitive" },
    },
  });

  if (existing) {
    throw new AppError("A product with this name already exists in this business", 409);
  }

  await assertShortCodeAvailable(businessId, shortCode);

  const product = await prisma.product.create({
    data: {
      businessId,
      name,
      unit,
      price: price ? parseFloat(price) : 0,
      description,
      shortCode,
    },
    include: {
      stock: {
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              isPrimary: true,
            },
          },
        },
      },
    },
  });

  return product;
};

/**
 * Get all products for a business
 */
const getProducts = async (businessId) => {
  const products = await prisma.product.findMany({
    where: { businessId },
    include: {
      stock: {
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              isPrimary: true,
              location: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Add total quantity across all warehouses
  const productsWithTotal = products.map((product) => ({
    ...product,
    totalQuantity: product.stock.reduce((sum, s) => sum + s.quantity, 0),
    primaryStock: product.stock.find((s) => s.warehouse.isPrimary) || null,
  }));

  return productsWithTotal;
};

/**
 * Get a single product
 */
const getProductById = async (productId, businessId) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      businessId,
    },
    include: {
      stock: {
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              isPrimary: true,
              location: true,
            },
          },
        },
      },
      transactionItems: {
        take: 10,
        orderBy: { transaction: { createdAt: "desc" } },
        include: {
          transaction: {
            select: {
              id: true,
              createdAt: true,
              paymentMethod: true,
              performedBy: {
                select: {
                  fullName: true,
                  username: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return {
    ...product,
    totalQuantity: product.stock.reduce((sum, s) => sum + s.quantity, 0),
    primaryStock: product.stock.find((s) => s.warehouse.isPrimary) || null,
  };
};

/**
 * Update a product
 */
const updateProduct = async (productId, businessId, { name, unit, price, description, shortCode }) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (name && name !== product.name) {
    const existing = await prisma.product.findFirst({
      where: {
        businessId,
        name: { equals: name, mode: "insensitive" },
        NOT: { id: productId },
      },
    });

    if (existing) {
      throw new AppError("A product with this name already exists", 409);
    }
  }

  if (shortCode && shortCode !== product.shortCode) {
    await assertShortCodeAvailable(businessId, shortCode, productId);
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(name && { name }),
      ...(unit && { unit }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(description !== undefined && { description }),
      ...(shortCode !== undefined && { shortCode }),
    },
    include: {
      stock: {
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              isPrimary: true,
            },
          },
        },
      },
    },
  });

  return updated;
};

/**
 * Delete a product
 */
const deleteProduct = async (productId, businessId) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Check if product has been used in transactions
  const transactionCount = await prisma.transactionItem.count({
    where: { productId },
  });

  if (transactionCount > 0) {
    throw new AppError(
      "Cannot delete a product that has transaction history. Consider archiving it instead."
    );
  }

  // Delete stock entries first then product
  await prisma.$transaction(async (tx) => {
    await tx.warehouseStock.deleteMany({
      where: { productId },
    });

    await tx.product.delete({
      where: { id: productId },
    });
  });

  return { message: "Product deleted successfully" };
};

/**
 * Receive incoming stock (a restock/delivery) into one warehouse, for one or more
 * products at once. Logs a RESTOCK movement per product line so it shows up in
 * the stock movements report.
 */
const receiveStock = async ({ businessId, warehouseId, items, movedById, notes }) => {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, businessId },
  });

  if (!warehouse) {
    throw new AppError("Warehouse not found", 404);
  }

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId },
  });

  if (products.length !== new Set(productIds).size) {
    throw new AppError("One or more products were not found in this business", 404);
  }

  const movements = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const { productId, quantity, lowStockThreshold } of items) {
      const existingStock = await tx.warehouseStock.findUnique({
        where: { warehouseId_productId: { warehouseId, productId } },
      });

      if (existingStock) {
        await tx.warehouseStock.update({
          where: { warehouseId_productId: { warehouseId, productId } },
          data: {
            quantity: existingStock.quantity + quantity,
            ...(lowStockThreshold !== undefined && { lowStockThreshold }),
          },
        });
      } else {
        await tx.warehouseStock.create({
          data: {
            warehouseId,
            productId,
            quantity,
            lowStockThreshold: lowStockThreshold ?? 10,
          },
        });
      }

      const movement = await tx.stockMovement.create({
        data: {
          businessId,
          fromWarehouseId: null,
          toWarehouseId: warehouseId,
          productId,
          quantity,
          type: "RESTOCK",
          status: "COMPLETED",
          movedById,
          notes,
        },
        include: {
          toWarehouse: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, unit: true } },
          movedBy: { select: { id: true, fullName: true, username: true } },
        },
      });

      created.push(movement);
    }

    return created;
  });

  return movements;
};

/**
 * Get all stock across all warehouses for a business
 */
const getAllStock = async (businessId) => {
  const warehouses = await prisma.warehouse.findMany({
    where: { businessId },
    include: {
      stock: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
              description: true,
            },
          },
        },
        orderBy: {
          quantity: "asc",
        },
      },
    },
    orderBy: [
      { isPrimary: "desc" },
      { createdAt: "asc" },
    ],
  });

  // Flag low stock items
  const warehousesWithAlerts = warehouses.map((warehouse) => ({
    ...warehouse,
    stock: warehouse.stock.map((item) => ({
      ...item,
      isLowStock: item.quantity <= item.lowStockThreshold,
      isOutOfStock: item.quantity === 0,
    })),
  }));

  return warehousesWithAlerts;
};

/**
 * Move stock between warehouses
 */
const moveStock = async ({
  businessId,
  fromWarehouseId,
  toWarehouseId,
  productId,
  quantity,
  movedById,
  notes,
}) => {
  if (fromWarehouseId === toWarehouseId) {
    throw new AppError("Cannot move stock to the same warehouse");
  }

  if (quantity <= 0) {
    throw new AppError("Quantity must be greater than 0");
  }

  // Check source stock
  const sourceStock = await prisma.warehouseStock.findUnique({
    where: {
      warehouseId_productId: {
        warehouseId: fromWarehouseId,
        productId,
      },
    },
    include: {
      product: true,
      warehouse: true,
    },
  });

  if (!sourceStock) {
    throw new AppError("Product not found in source warehouse", 404);
  }

  if (sourceStock.quantity < quantity) {
    throw new AppError(
      `Insufficient stock. Available: ${sourceStock.quantity} ${sourceStock.product.unit}`
    );
  }

  // Perform the stock movement in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deduct from source warehouse
    await tx.warehouseStock.update({
      where: {
        warehouseId_productId: {
          warehouseId: fromWarehouseId,
          productId,
        },
      },
      data: {
        quantity: sourceStock.quantity - quantity,
      },
    });

    // Add to destination warehouse
    const destStock = await tx.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: toWarehouseId,
          productId,
        },
      },
    });

    if (destStock) {
      await tx.warehouseStock.update({
        where: {
          warehouseId_productId: {
            warehouseId: toWarehouseId,
            productId,
          },
        },
        data: {
          quantity: destStock.quantity + quantity,
        },
      });
    } else {
      await tx.warehouseStock.create({
        data: {
          warehouseId: toWarehouseId,
          productId,
          quantity,
        },
      });
    }

    // Record the movement
    const movement = await tx.stockMovement.create({
      data: {
        businessId,
        fromWarehouseId,
        toWarehouseId,
        productId,
        quantity,
        movedById,
        notes,
        type: "TRANSFER",
        status: "COMPLETED",
      },
      include: {
        fromWarehouse: {
          select: { id: true, name: true },
        },
        toWarehouse: {
          select: { id: true, name: true },
        },
        product: {
          select: { id: true, name: true, unit: true },
        },
        movedBy: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });

    return movement;
  });

  return result;
};

/**
 * Get stock movement history for a business
 */
const getStockMovements = async (businessId, filters = {}) => {
  const { startDate, endDate, fromWarehouseId, toWarehouseId, productId, type } = filters;

  const where = { businessId };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startOfDay(new Date(startDate));
    if (endDate) where.createdAt.lte = endOfDay(new Date(endDate));
  }
  if (fromWarehouseId) where.fromWarehouseId = fromWarehouseId;
  if (toWarehouseId) where.toWarehouseId = toWarehouseId;
  if (productId) where.productId = productId;
  if (type) where.type = type;

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      fromWarehouse: {
        select: { id: true, name: true },
      },
      toWarehouse: {
        select: { id: true, name: true },
      },
      product: {
        select: { id: true, name: true, unit: true },
      },
      movedBy: {
        select: { id: true, fullName: true, username: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return movements;
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  receiveStock,
  getAllStock,
  moveStock,
  getStockMovements,
};