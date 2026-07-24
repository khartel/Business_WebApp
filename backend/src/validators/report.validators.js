const { z } = require("zod");

const businessIdParamSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
};

const dateQuerySchema = {
  params: businessIdParamSchema.params,
  query: z.object({
    date: z.string().optional(),
  }),
};

const monthlyQuerySchema = {
  params: businessIdParamSchema.params,
  query: z.object({
    year: z.coerce.number().int().optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  }),
};

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
