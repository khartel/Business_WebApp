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

const shortCodeField = z
  .string()
  .trim()
  .max(20, "Short code must be 20 characters or fewer")
  .optional()
  .transform((value) => (value ? value : undefined));

const createProductSchema = {
  params: businessIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1, "Product name is required"),
    unit: z.string().trim().min(1, "Unit is required"),
    price: z.coerce.number().nonnegative("Price cannot be negative").optional(),
    description: z.string().trim().optional(),
    shortCode: shortCodeField,
  }),
};

const updateProductSchema = {
  params: productIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1).optional(),
    unit: z.string().trim().min(1).optional(),
    price: z.coerce.number().nonnegative("Price cannot be negative").optional(),
    description: z.string().trim().optional(),
    shortCode: shortCodeField,
  }),
};

module.exports = {
  businessIdParamSchema,
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
};
