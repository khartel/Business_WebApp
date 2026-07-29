/**
 * Zod request-validation schemas for the reporting endpoints (daily,
 * monthly, and custom date-range reports for a business).
 */
const { z } = require("zod");

/** Validates routes scoped to a business only. */
const businessIdParamSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
};

/** Validates a single-day report query; `date` optional (defaults to today downstream if omitted). */
const dateQuerySchema = {
  params: businessIdParamSchema.params,
  query: z.object({
    date: z.string().optional(),
  }),
};

/** Validates a month-level report query; month is 1-12 when provided. */
const monthlyQuerySchema = {
  params: businessIdParamSchema.params,
  query: z.object({
    year: z.coerce.number().int().optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  }),
};

/** Validates a custom start/end date-range report query. */
const dateRangeQuerySchema = {
  params: businessIdParamSchema.params,
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
};

module.exports = {
  businessIdParamSchema,
  dateQuerySchema,
  monthlyQuerySchema,
  dateRangeQuerySchema,
};
