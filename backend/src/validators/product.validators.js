const { z } = require("zod");

const businessIdParamSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
};

const productIdParamSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    productId: z.string().uuid("Invalid product id"),
  }),
};

const createProductSchema = {
  params: businessIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1, "Product name is required"),
    unit: z.string().trim().min(1, "Unit is required"),
    price: z.coerce.number().nonnegative("Price cannot be negative").optional(),
    description: z.string().trim().optional(),
  }),
};

const updateProductSchema = {
  params: productIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1).optional(),
    unit: z.string().trim().min(1).optional(),
    price: z.coerce.number().nonnegative("Price cannot be negative").optional(),
    description: z.string().trim().optional(),
  }),
};

const addStockSchema = {
  params: productIdParamSchema.params,
  body: z.object({
    warehouseId: z.string().uuid("Invalid warehouse id"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    lowStockThreshold: z.coerce.number().nonnegative().optional(),
  }),
};

module.exports = {
  businessIdParamSchema,
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
  addStockSchema,
};
