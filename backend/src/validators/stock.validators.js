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

module.exports = { businessIdParamSchema, moveStockSchema };
