/**
 * Zod request-validation schemas for the transaction/sale endpoints
 * (creating sales, listing/filtering them, and recording credit payments).
 */
const { z } = require("zod");

/** Validates routes scoped to a business only. */
const businessIdParamSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
};

/** Validates routes that target a specific transaction (e.g. recording a payment against it). */
const transactionIdParamSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    transactionId: z.string().uuid("Invalid transaction id"),
  }),
};

/**
 * Validates POST .../transactions - creates a sale with one or more line
 * items. `customerName` is conditionally required: the refine() enforces it
 * whenever paymentMethod is "CREDIT", since a credit sale needs a customer
 * to bill later.
 */
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
            // Display-only: which pack size was actually rung up (e.g.
            // "dozen" x 2), when not the product's base unit.
            // quantitySold/unitPrice above must already be in base-unit terms.
            unitLabel: z.string().trim().optional(),
            unitQuantity: z.coerce.number().positive().optional(),
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

/** Validates GET .../transactions - filters by performer, payment method, paid status, date range, plus pagination. */
const listTransactionsQuerySchema = {
  params: businessIdParamSchema.params,
  query: z.object({
    performedById: z.string().uuid().optional(),
    paymentMethod: z.enum(["CASH", "TRANSFER", "CREDIT"]).optional(),
    paid: z.enum(["true", "false"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};

/** Validates POST .../transactions/:transactionId/payments - records a payment amount against a credit sale. */
const recordPaymentSchema = {
  params: transactionIdParamSchema.params,
  body: z.object({
    amount: z.coerce.number().positive("Amount must be greater than 0"),
  }),
};

/** Validates DELETE .../transactions/:transactionId/payments/:paymentId - undoes a recorded credit payment. */
const undoPaymentSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    transactionId: z.string().uuid("Invalid transaction id"),
    paymentId: z.string().uuid("Invalid payment id"),
  }),
};

module.exports = {
  businessIdParamSchema,
  transactionIdParamSchema,
  createTransactionSchema,
  listTransactionsQuerySchema,
  recordPaymentSchema,
  undoPaymentSchema,
};
