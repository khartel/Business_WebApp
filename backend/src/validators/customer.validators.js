/**
 * Zod request-validation schemas for the customer endpoints (list/create/
 * update customers within a business).
 */
const { z } = require("zod");
const { isValidPhoneNumber } = require("libphonenumber-js");

/** Validates routes scoped to a business only (e.g. GET/POST /businesses/:businessId/customers). */
const businessIdParamSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
};

// Shared phone check - expects the E.164-formatted string the frontend's
// country-flag phone input produces (e.g. "+2348012345678").
const phoneSchema = z.string().trim().refine(isValidPhoneNumber, "Enter a valid phone number");

/** Validates routes that also target a specific customer (e.g. PATCH/DELETE /businesses/:businessId/customers/:customerId). */
const customerIdParamSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    customerId: z.string().uuid("Invalid customer id"),
  }),
};

/** Validates POST /businesses/:businessId/customers - creates a customer; phone and address are required so every saved customer is actually reachable/locatable. */
const createCustomerSchema = {
  params: businessIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1, "Customer name is required"),
    phone: phoneSchema,
    address: z.string().trim().min(1, "Address is required"),
  }),
};

/** Validates PATCH .../customers/:customerId - fields optional to support partial updates, but validated the same way when provided. */
const updateCustomerSchema = {
  params: customerIdParamSchema.params,
  body: z.object({
    name: z.string().trim().min(1).optional(),
    phone: phoneSchema.optional(),
    address: z.string().trim().min(1, "Address is required").optional(),
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

/** Validates POST .../customers/:customerId/merge - merges :customerId into `intoCustomerId`. */
const mergeCustomerSchema = {
  params: customerIdParamSchema.params,
  body: z.object({
    intoCustomerId: z.string().uuid("Invalid target customer id"),
  }),
};

module.exports = {
  businessIdParamSchema,
  customerIdParamSchema,
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  mergeCustomerSchema,
};
