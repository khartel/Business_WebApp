const { z } = require("zod");

const businessIdParamSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
};

const moveStockSchema = {
  params: businessIdParamSchema.params,
  body: z.object({
    fromWarehouseId: z.string().uuid("Invalid source warehouse id"),
    toWarehouseId: z.string().uuid("Invalid destination warehouse id"),
    productId: z.string().uuid("Invalid product id"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    notes: z.string().trim().optional(),
  }),
};

const movementsQuerySchema = {
  params: businessIdParamSchema.params,
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    fromWarehouseId: z.string().uuid("Invalid source warehouse id").optional(),
    toWarehouseId: z.string().uuid("Invalid destination warehouse id").optional(),
    productId: z.string().uuid("Invalid product id").optional(),
    type: z.enum(["RESTOCK", "TRANSFER"]).optional(),
  }),
};

const receiveStockSchema = {
  params: businessIdParamSchema.params,
  body: z.object({
    warehouseId: z.string().uuid("Invalid warehouse id"),
    items: z
      .array(
        z.object({
          productId: z.string().uuid("Invalid product id"),
          quantity: z.coerce.number().positive("Quantity must be greater than 0"),
          lowStockThreshold: z.coerce.number().nonnegative().optional(),
        })
      )
      .min(1, "Add at least one product"),
    notes: z.string().trim().optional(),
  }),
};

module.exports = { businessIdParamSchema, moveStockSchema, receiveStockSchema, movementsQuerySchema };
