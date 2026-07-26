const { z } = require("zod");

const businessIdParamSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
};

const customerIdParamSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    customerId: z.string().uuid("Invalid customer id"),
  }),
};

const createCustomerSchema = {
  params: businessIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1, "Customer name is required"),
    phone: z.string().trim().optional(),
  }),
};

const updateCustomerSchema = {
  params: customerIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().optional(),
  }),
};

const listCustomersQuerySchema = {
  params: businessIdParamSchema.params,
  query: z.object({
    search: z.string().trim().optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
  }),
};

module.exports = {
  businessIdParamSchema,
  customerIdParamSchema,
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
};
