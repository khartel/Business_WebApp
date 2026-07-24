const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

/**
 * Create a new warehouse
 */
const createWarehouse = async ({ businessId, name, location, isPrimary, userId }) => {
  // Check if business exists and user has access
  const business = await prisma.business.findFirst({
    where: { id: businessId },
  });

  if (!business) {
    throw new AppError("Business not found", 404);
  }

  // If this warehouse is set as primary
  // remove primary from all other warehouses first
  if (isPrimary) {
    await prisma.warehouse.updateMany({
      where: { businessId },
      data: { isPrimary: false },
    });
  }

  // If this is the first warehouse, make it primary automatically
  const warehouseCount = await prisma.warehouse.count({
    where: { businessId },
  });

  const shouldBePrimary = isPrimary || warehouseCount === 0;

  const warehouse = await prisma.warehouse.create({
    data: {
      businessId,
      name,
      location,
      isPrimary: shouldBePrimary,
    },
    include: {
      _count: {
        select: { stock: true },
      },
    },
  });

  return warehouse;
};

/**
 * Get all warehouses for a business
 */
const getWarehouses = async (businessId) => {
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
            },
          },
        },
      },
      _count: {
        select: {
          stock: true,
          transactions: true,
        },
      },
    },
    orderBy: [
      { isPrimary: "desc" },
      { createdAt: "asc" },
    ],
  });

  return warehouses;
};

/**
 * Get a single warehouse
 */
const getWarehouseById = async (warehouseId, businessId) => {
  const warehouse = await prisma.warehouse.findFirst({
    where: {
      id: warehouseId,
      businessId,
    },
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
      _count: {
        select: {
          stock: true,
          transactions: true,
        },
      },
    },
  });

  if (!warehouse) {
    throw new AppError("Warehouse not found", 404);
  }

  return warehouse;
};

/**
 * Set a warehouse as primary
 */
const setPrimaryWarehouse = async (warehouseId, businessId) => {
  // Make sure warehouse belongs to this business
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, businessId },
  });

  if (!warehouse) {
    throw new AppError("Warehouse not found", 404);
  }

  // Remove primary from all warehouses in this business
  await prisma.warehouse.updateMany({
    where: { businessId },
    data: { isPrimary: false },
  });

  // Set this one as primary
  const updated = await prisma.warehouse.update({
    where: { id: warehouseId },
    data: { isPrimary: true },
  });

  return updated;
};

/**
 * Update warehouse details
 */
const updateWarehouse = async (warehouseId, businessId, { name, location }) => {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, businessId },
  });

  if (!warehouse) {
    throw new AppError("Warehouse not found", 404);
  }

  const updated = await prisma.warehouse.update({
    where: { id: warehouseId },
    data: {
      ...(name && { name }),
      ...(location && { location }),
    },
  });

  return updated;
};

/**
 * Delete a warehouse
 */
const deleteWarehouse = async (warehouseId, businessId) => {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, businessId },
  });

  if (!warehouse) {
    throw new AppError("Warehouse not found", 404);
  }

  if (warehouse.isPrimary) {
    throw new AppError(
      "Cannot delete the primary warehouse. Set another warehouse as primary first."
    );
  }

  // Check if warehouse has stock
  const stockCount = await prisma.warehouseStock.count({
    where: { warehouseId },
  });

  if (stockCount > 0) {
    throw new AppError(
      "Cannot delete a warehouse that has stock. Move stock to another warehouse first."
    );
  }

  await prisma.warehouse.delete({
    where: { id: warehouseId },
  });

  return { message: "Warehouse deleted successfully" };
};

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  setPrimaryWarehouse,
  updateWarehouse,
  deleteWarehouse,
};