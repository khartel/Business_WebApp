const { z } = require("zod");

const businessIdParamSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
};

const transactionIdParamSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    transactionId: z.string().uuid("Invalid transaction id"),
  }),
};

const createTransactionSchema = {
  params: businessIdParamSchema.params,
  body: z
    .object({
      paymentMethod: z.enum(["CASH", "TRANSFER", "CREDIT"], {
        message: "Payment method must be CASH, TRANSFER, or CREDIT",
      }),
      customerName: z.string().trim().optional(),
      notes: z.string().trim().optional(),
      items: z
        .array(
          z.object({
            productId: z.string().uuid("Invalid product id"),
            quantitySold: z.coerce.number().positive("Quantity must be greater than 0"),
            unitPrice: z.coerce.number().positive("Unit price must be greater than 0"),
            discountPercent: z.coerce.number().min(0).max(100).optional(),
          })
        )
        .min(1, "At least one item is required"),
    })
    .refine(
      (data) => data.paymentMethod !== "CREDIT" || !!data.customerName?.trim(),
      {
        message: "Customer name is required for credit sales",
        path: ["customerName"],
      }
    ),
};

const listTransactionsQuerySchema = {
  params: businessIdParamSchema.params,
  query: z.object({
    performedById: z.string().uuid().optional(),
    paymentMethod: z.enum(["CASH", "TRANSFER", "CREDIT"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};

module.exports = {
  businessIdParamSchema,
  transactionIdParamSchema,
  createTransactionSchema,
  listTransactionsQuerySchema,
};
