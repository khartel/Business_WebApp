const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

/**
 * Computes how much of a transaction's total is still unpaid, by summing
 * any recorded CreditPayments and subtracting from the total. Rounded to
 * 2 decimal places to avoid floating-point cent drift. Meaningful mainly
 * for CREDIT sales, but safe to call on any transaction (payments will
 * simply be empty).
 */
const balanceDueOf = (transaction) => {
  const amountPaid = (transaction.payments || []).reduce((sum, p) => sum + p.amount, 0);
  return Math.round((transaction.totalAmount - amountPaid) * 100) / 100;
};

/**
 * Derives a customer's summary stats from their loaded transaction history:
 * total number of transactions, lifetime amount spent, and outstanding
 * credit — the sum of balances still owed on CREDIT sales that haven't
 * been marked fully paid (`paidAt` is null). Strips the raw `transactions`
 * array out of the returned object in favor of these aggregates, since
 * list views only need the summary, not every line item.
 */
const withStats = (customer) => {
  const { transactions, ...rest } = customer;
  const totalSpent = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const outstandingCredit = transactions
    .filter((t) => t.paymentMethod === "CREDIT" && !t.paidAt)
    .reduce((sum, t) => sum + balanceDueOf(t), 0);

  return {
    ...rest,
    transactionCount: transactions.length,
    totalSpent,
    outstandingCredit,
  };
};

/**
 * Create a new customer record for a business. Returns it pre-shaped with
 * zeroed stats (transactionCount/totalSpent/outstandingCredit) so the
 * response matches the shape of `getCustomers`/`getCustomerById` without an
 * extra round-trip, since a brand-new customer has no transactions yet.
 *
 * @param {{businessId: string, name: string, phone?: string}} params
 * @returns {Promise<object>} The created customer with zeroed stats.
 */
const createCustomer = async ({ businessId, name, phone }) => {
  const customer = await prisma.customer.create({
    data: { businessId, name, phone },
  });

  return { ...customer, transactionCount: 0, totalSpent: 0, outstandingCredit: 0 };
};

/**
 * List customers for a business, each annotated with aggregated spend/credit
 * stats (via `withStats`). Supports an optional case-insensitive name search
 * and a result limit, used to power the register's customer autocomplete as
 * well as the full Customers page.
 *
 * @param {string} businessId
 * @param {{search?: string, limit?: number}} [options]
 * @returns {Promise<object[]>} Customers sorted alphabetically by name.
 */
const getCustomers = async (businessId, { search, limit } = {}) => {
  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    },
    include: {
      transactions: {
        select: {
          totalAmount: true,
          paymentMethod: true,
          paidAt: true,
          payments: { select: { amount: true } },
        },
      },
    },
    orderBy: { name: "asc" },
    ...(limit && { take: limit }),
  });

  return customers.map(withStats);
};

/**
 * Get a single customer with their full transaction history, each
 * transaction annotated with `amountPaid`/`balanceDue` so the UI can show
 * a running credit ledger per sale (not just the aggregate outstanding
 * total that `withStats` provides).
 *
 * @param {string} customerId
 * @param {string} businessId - Scopes the lookup to this business.
 * @returns {Promise<object>} Customer with stats and a `transactions` array.
 * @throws {AppError} 404 if not found in this business.
 */
const getCustomerById = async (customerId, businessId) => {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, unit: true } },
            },
          },
          performedBy: { select: { id: true, fullName: true, username: true } },
          warehouse: { select: { id: true, name: true, isPrimary: true } },
          payments: { select: { amount: true } },
        },
      },
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const transactionsWithBalance = customer.transactions.map((t) => ({
    ...t,
    amountPaid: Math.round((t.totalAmount - balanceDueOf(t)) * 100) / 100,
    balanceDue: balanceDueOf(t),
  }));

  return { ...withStats(customer), transactions: transactionsWithBalance };
};

/**
 * Update a customer's name and/or phone. Only provided fields are changed;
 * name is required to be truthy to apply (falsy values are ignored, not
 * cleared), while phone can be explicitly cleared via `undefined` check.
 *
 * @param {string} customerId
 * @param {string} businessId - Scopes the lookup to this business.
 * @param {{name?: string, phone?: string}} fields
 * @returns {Promise<object>} The updated customer.
 * @throws {AppError} 404 if not found in this business.
 */
const updateCustomer = async (customerId, businessId, { name, phone }) => {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
    },
  });

  return updated;
};

/**
 * Delete a customer. Their past transactions are kept (customerName is a
 * snapshot on the transaction) but unlinked via onDelete: SetNull.
 */
const deleteCustomer = async (customerId, businessId) => {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  await prisma.customer.delete({ where: { id: customerId } });

  return { message: "Customer deleted successfully" };
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
