/**
 * Zod request-validation schemas for the business endpoints (create/update
 * a business, and route params carrying a business id).
 */
const { z } = require("zod");

/** Validates POST /businesses - creates a new business; country determines the default currency. */
const createBusinessSchema = {
  body: z.object({
    name: z.string().trim().min(1, "Business name is required"),
    phone: z.string().trim().min(7, "Phone number is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    country: z.string().trim().min(1, "Country is required"),
    location: z.string().trim().min(1, "Location is required"),
  }),
};

/**
 * Validates PATCH /businesses/:id - all body fields are optional to support
 * partial updates. Includes receipt-branding fields (title, footer note,
 * whether to show a signature line) alongside the core business fields.
 */
const updateBusinessSchema = {
  params: z.object({ id: z.string().uuid("Invalid business id") }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(7).optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    location: z.string().trim().min(1).optional(),
    receiptTitle: z.string().trim().min(1).max(40).optional(),
    receiptFooterNote: z.string().trim().max(200).optional(),
    receiptShowSignature: z.boolean().optional(),
  }),
};

/** Validates routes that take a business id in the URL (e.g. GET/DELETE /businesses/:id). */
const businessIdParamSchema = {
  params: z.object({ id: z.string().uuid("Invalid business id") }),
};

module.exports = { createBusinessSchema, updateBusinessSchema, businessIdParamSchema };
