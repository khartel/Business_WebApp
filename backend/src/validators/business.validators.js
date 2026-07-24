const { z } = require("zod");

const createBusinessSchema = {
  body: z.object({
    name: z.string().trim().min(1, "Business name is required"),
    phone: z.string().trim().min(7, "Phone number is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    country: z.string().trim().min(1, "Country is required"),
    location: z.string().trim().min(1, "Location is required"),
  }),
};

const updateBusinessSchema = {
  params: z.object({ id: z.string().uuid("Invalid business id") }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(7).optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    location: z.string().trim().min(1).optional(),
  }),
};

const businessIdParamSchema = {
  params: z.object({ id: z.string().uuid("Invalid business id") }),
};

module.exports = { createBusinessSchema, updateBusinessSchema, businessIdParamSchema };
