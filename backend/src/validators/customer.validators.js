/**
 * Zod request-validation schemas for the customer endpoints (list/create/
 * update customers within a business).
 */
const { z } = require("zod");

/** Validates routes scoped to a business only (e.g. GET/POST /businesses/:businessId/customers). */
const businessIdParamSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
};

/** Validates routes that also target a specific customer (e.g. PATCH/DELETE /businesses/:businessId/customers/:customerId). */
const customerIdParamSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    customerId: z.string().uuid("Invalid customer id"),
  }),
};

/** Validates POST /businesses/:businessId/customers - creates a customer; phone is optional. */
const createCustomerSchema = {
  params: businessIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1, "Customer name is required"),
    phone: z.string().trim().optional(),
  }),
};

/** Validates PATCH .../customers/:customerId - fields optional to support partial updates. */
const updateCustomerSchema = {
  params: customerIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().optional(),
  }),
};

/** Validates GET .../customers - optional search term and a result limit capped at 50. */
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
