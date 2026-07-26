const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

const balanceDueOf = (transaction) => {
  const amountPaid = (transaction.payments || []).reduce((sum, p) => sum + p.amount, 0);
  return Math.round((transaction.totalAmount - amountPaid) * 100) / 100;
};

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
 * Create a new customer for a business
 */
const createCustomer = async ({ businessId, name, phone }) => {
  const customer = await prisma.customer.create({
    data: { businessId, name, phone },
  });

  return { ...customer, transactionCount: 0, totalSpent: 0, outstandingCredit: 0 };
};

/**
 * Get all customers for a business, with aggregated spend/credit stats
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
 * Get a single customer with full transaction history
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
 * Update a customer
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
