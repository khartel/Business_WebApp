const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

/**
 * Create a new warehouse for a business. Enforces the invariant that a
 * business has exactly one primary warehouse at a time (the one sales are
 * fulfilled from and stock reports default to): if `isPrimary` is
 * requested, all other warehouses are demoted first. Additionally, the
 * very first warehouse a business creates is always made primary
 * automatically, even if not explicitly requested, so a business is never
 * left without one (which would block making sales).
 *
 * @param {object} params
 * @param {string} params.businessId
 * @param {string} params.name
 * @param {string} params.location
 * @param {boolean} [params.isPrimary]
 * @param {string} [params.userId] - Currently unused; reserved for auditing.
 * @returns {Promise<object>} The created warehouse.
 * @throws {AppError} 404 if the business doesn't exist.
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
 * List all warehouses for a business with their stock and activity counts,
 * primary warehouse first (then by creation order).
 *
 * @param {string} businessId
 * @returns {Promise<object[]>}
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
 * Get a single warehouse with its stock (lowest quantity first, to surface
 * items needing attention) and activity counts.
 *
 * @param {string} warehouseId
 * @param {string} businessId - Scopes the lookup to this business.
 * @returns {Promise<object>}
 * @throws {AppError} 404 if not found in this business.
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
 * Promote a warehouse to be the business's primary one, demoting whichever
 * warehouse held that status before. Since sales are always fulfilled from
 * the primary warehouse, this effectively switches which stock pool the
 * register sells against going forward.
 *
 * @param {string} warehouseId
 * @param {string} businessId - Scopes the lookup to this business.
 * @returns {Promise<object>} The now-primary warehouse.
 * @throws {AppError} 404 if not found in this business.
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
 * Update a warehouse's name and/or location. Does not touch `isPrimary` —
 * use `setPrimaryWarehouse` for that.
 *
 * @param {string} warehouseId
 * @param {string} businessId - Scopes the lookup to this business.
 * @param {{name?: string, location?: string}} fields
 * @returns {Promise<object>} The updated warehouse.
 * @throws {AppError} 404 if not found in this business.
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
 * Delete a warehouse. Two safety rules prevent data loss / an unsellable
 * state: the primary warehouse can never be deleted directly (another one
 * must be promoted first via `setPrimaryWarehouse`), and a warehouse still
 * holding any stock can't be deleted until that stock is moved elsewhere
 * via `moveStock` — otherwise the stock rows (and their history) would be
 * silently destroyed.
 *
 * @param {string} warehouseId
 * @param {string} businessId - Scopes the lookup to this business.
 * @returns {Promise<{message: string}>}
 * @throws {AppError} 404 if not found; error if it's primary or still has stock.
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