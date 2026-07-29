/**
 * Zod request-validation schemas for warehouse endpoints (create/update
 * warehouses within a business).
 */
const { z } = require("zod");

/** Validates POST .../warehouses - creates a warehouse; `isPrimary` optionally marks it as the business's default warehouse. */
const createWarehouseSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
  body: z.object({
    name: z.string().trim().min(1, "Warehouse name is required"),
    location: z.string().trim().optional(),
    isPrimary: z.boolean().optional(),
  }),
};

/** Validates routes that target a specific warehouse within a business. */
const warehouseIdParamSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    warehouseId: z.string().uuid("Invalid warehouse id"),
  }),
};

/** Validates PATCH .../warehouses/:warehouseId - fields optional to support partial updates. */
const updateWarehouseSchema = {
  params: warehouseIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1).optional(),
    location: z.string().trim().optional(),
  }),
};

module.exports = { createWarehouseSchema, warehouseIdParamSchema, updateWarehouseSchema };
