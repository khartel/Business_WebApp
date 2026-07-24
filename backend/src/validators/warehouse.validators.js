const { z } = require("zod");

const createWarehouseSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
  body: z.object({
    name: z.string().trim().min(1, "Warehouse name is required"),
    location: z.string().trim().optional(),
    isPrimary: z.boolean().optional(),
  }),
};

const warehouseIdParamSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    warehouseId: z.string().uuid("Invalid warehouse id"),
  }),
};

const updateWarehouseSchema = {
  params: warehouseIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1).optional(),
    location: z.string().trim().optional(),
  }),
};

module.exports = { createWarehouseSchema, warehouseIdParamSchema, updateWarehouseSchema };
