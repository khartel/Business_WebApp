const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

// Shared include shape so every read path (create/list/get-one) returns the
// same structure, including the credit-payment history needed to compute
// amountPaid/balanceDue.
const TRANSACTION_INCLUDE = {
  items: {
    include: {
      product: {
        select: { id: true, name: true, unit: true },
      },
    },
  },
  performedBy: {
    select: { id: true, fullName: true, username: true, role: true },
  },
  warehouse: {
    select: { id: true, name: true, isPrimary: true },
  },
  payments: {
    include: {
      recordedBy: { select: { id: true, fullName: true, username: true } },
    },
    orderBy: { createdAt: "asc" },
  },
};

/**
 * Attach computed amountPaid/balanceDue (only meaningful for CREDIT sales,
 * but harmless — 0 paid / balanceDue === totalAmount — for others).
 */
const withCreditStats = (transaction) => {
  const amountPaid =
    Math.round(transaction.payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
  const balanceDue = Math.round((transaction.totalAmount - amountPaid) * 100) / 100;

  return { ...transaction, amountPaid, balanceDue };
};

/**
 * Create a new transaction (sale)
 */
const createTransaction = async ({
  businessId,
  performedById,
  paymentMethod,
  customerName,
  items,
  notes,
}) => {
  // Get the primary warehouse for this business
  const primaryWarehouse = await prisma.warehouse.findFirst({
    where: {
      businessId,
      isPrimary: true,
    },
  });

  if (!primaryWarehouse) {
    throw new AppError(
      "No primary warehouse found. Please set a primary warehouse before making sales."
    );
  }

  // Validate all items and check stock
  const itemsWithDetails = await Promise.all(
    items.map(async (item) => {
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          businessId,
        },
      });

      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      const stock = await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: primaryWarehouse.id,
            productId: item.productId,
          },
        },
      });

      if (!stock || stock.quantity < item.quantitySold) {
        throw new AppError(
          `Insufficient stock for "${product.name}". ` +
          `Available: ${stock ? stock.quantity : 0} ${product.unit}, ` +
          `Requested: ${item.quantitySold} ${product.unit}`
        );
      }

      if (item.quantitySold <= 0) {
        throw new AppError(`Quantity for "${product.name}" must be greater than 0`);
      }

      if (item.unitPrice <= 0) {
        throw new AppError(`Price for "${product.name}" must be greater than 0`);
      }

      return {
        productId: item.productId,
        productName: product.name,
        quantitySold: item.quantitySold,
        unitPrice: item.unitPrice,
        subtotal: item.quantitySold * item.unitPrice,
        discountPercent: item.discountPercent ?? null,
        currentStock: stock.quantity,
      };
    })
  );

  const totalAmount = itemsWithDetails.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  const trimmedCustomerName = customerName?.trim();

  const transaction = await prisma.$transaction(async (tx) => {
    // Recognize a returning customer by exact (case-insensitive) name match,
    // or quietly create a lightweight record for a new one — this is what
    // powers the register's autocomplete and the Customers/Credit tracking
    // page, without requiring anyone to pre-register a customer first.
    let customerId = null;
    if (trimmedCustomerName) {
      const existingCustomer = await tx.customer.findFirst({
        where: { businessId, name: { equals: trimmedCustomerName, mode: "insensitive" } },
      });
      customerId = existingCustomer
        ? existingCustomer.id
        : (await tx.customer.create({ data: { businessId, name: trimmedCustomerName } })).id;
    }

    const newTransaction = await tx.transaction.create({
      data: {
        businessId,
        warehouseId: primaryWarehouse.id,
        performedById,
        customerId,
        paymentMethod,
        totalAmount,
        customerName: trimmedCustomerName || "Casual Customer",
        notes,
        items: {
          create: itemsWithDetails.map((item) => ({
            productId: item.productId,
            quantitySold: item.quantitySold,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            discountPercent: item.discountPercent,
          })),
        },
      },
      include: TRANSACTION_INCLUDE,
    });

    await Promise.all(
      itemsWithDetails.map((item) =>
        tx.warehouseStock.update({
          where: {
            warehouseId_productId: {
              warehouseId: primaryWarehouse.id,
              productId: item.productId,
            },
          },
          data: {
            quantity: item.currentStock - item.quantitySold,
          },
        })
      )
    );

    return newTransaction;
  });

  return withCreditStats(transaction);
};

/**
 * Get all transactions for a business
 * with optional filters
 */
const getTransactions = async ({
  businessId,
  performedById,
  paymentMethod,
  paid,
  startDate,
  endDate,
  page = 1,
  limit = 20,
}) => {
  // Build filter
  const where = { businessId };

  // Filter by employee
  if (performedById) {
    where.performedById = performedById;
  }

  // Filter by payment method
  if (paymentMethod) {
    where.paymentMethod = paymentMethod;
  }

  // Filter by credit-settlement status (only meaningful alongside paymentMethod=CREDIT)
  if (paid === "true") {
    where.paidAt = { not: null };
  } else if (paid === "false") {
    where.paidAt = null;
  }

  // Filter by date range
  if (startDate || endDate) {
    where.createdAt = {};

    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }

    if (endDate) {
      // Set end date to end of that day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  // Count total for pagination
  const total = await prisma.transaction.count({ where });

  // Fetch transactions
  const transactions = await prisma.transaction.findMany({
    where,
    include: TRANSACTION_INCLUDE,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    transactions: transactions.map(withCreditStats),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single transaction
 */
const getTransactionById = async (transactionId, businessId) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      businessId,
    },
    include: TRANSACTION_INCLUDE,
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  return withCreditStats(transaction);
};

/**
 * Record a payment against a CREDIT sale — either the full remaining
 * balance in one go, or a partial amount if the customer is paying it off
 * over time. Once cumulative payments cover the total, the sale is marked
 * settled (paidAt).
 */
const recordCreditPayment = async (transactionId, businessId, { amount, recordedById }) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, businessId },
    include: { payments: true },
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  if (transaction.paymentMethod !== "CREDIT") {
    throw new AppError("Only credit sales can have payments recorded against them");
  }

  const amountPaidSoFar = transaction.payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.round((transaction.totalAmount - amountPaidSoFar) * 100) / 100;

  if (balanceDue <= 0) {
    throw new AppError("This sale has already been fully paid");
  }

  if (amount <= 0) {
    throw new AppError("Payment amount must be greater than 0");
  }

  if (amount > balanceDue + 0.01) {
    throw new AppError(`Payment can't exceed the outstanding balance of ${balanceDue}`);
  }

  const isNowSettled = amount >= balanceDue - 0.01;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.creditPayment.create({
      data: { transactionId, amount, recordedById },
    });

    return tx.transaction.update({
      where: { id: transactionId },
      data: isNowSettled ? { paidAt: new Date() } : {},
      include: TRANSACTION_INCLUDE,
    });
  });

  return withCreditStats(updated);
};

/**
 * Get transaction summary for dashboard
 */
const getTransactionSummary = async (businessId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Start of current week (Monday)
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  // Start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Todays transactions
  const todayTransactions = await prisma.transaction.findMany({
    where: {
      businessId,
      createdAt: {
        gte: today,
        lte: endOfToday,
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      },
      performedBy: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Weekly total
  const weeklyTotal = await prisma.transaction.aggregate({
    where: {
      businessId,
      createdAt: { gte: startOfWeek, lte: endOfToday },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  // Monthly total
  const monthlyTotal = await prisma.transaction.aggregate({
    where: {
      businessId,
      createdAt: { gte: startOfMonth, lte: endOfToday },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  // Today totals
  const todayTotal = todayTransactions.reduce(
    (sum, t) => sum + t.totalAmount,
    0
  );

  // Today totals by payment method
  const cashTotal = todayTransactions
    .filter((t) => t.paymentMethod === "CASH")
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const transferTotal = todayTransactions
    .filter((t) => t.paymentMethod === "TRANSFER")
    .reduce((sum, t) => sum + t.totalAmount, 0);

  // Today sales by employee
  const employeeSales = {};
  todayTransactions.forEach((t) => {
    const key = t.performedById;
    if (!employeeSales[key]) {
      employeeSales[key] = {
        employee: t.performedBy,
        totalAmount: 0,
        transactionCount: 0,
        transactions: [],
      };
    }
    employeeSales[key].totalAmount += t.totalAmount;
    employeeSales[key].transactionCount += 1;
    employeeSales[key].transactions.push(t);
  });

  // Top selling products today
  const productSales = {};
  todayTransactions.forEach((t) => {
    t.items.forEach((item) => {
      const key = item.productId;
      if (!productSales[key]) {
        productSales[key] = {
          product: item.product,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      productSales[key].totalQuantity += item.quantitySold;
      productSales[key].totalRevenue += item.subtotal;
    });
  });

  return {
    today: {
      totalAmount: todayTotal,
      transactionCount: todayTransactions.length,
      cashTotal,
      transferTotal,
      transactions: todayTransactions,
    },
    byEmployee: Object.values(employeeSales),
    topProducts: Object.values(productSales).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    ),
    weekly: {
      totalAmount: weeklyTotal._sum.totalAmount || 0,
      transactionCount: weeklyTotal._count,
    },
    monthly: {
      totalAmount: monthlyTotal._sum.totalAmount || 0,
      transactionCount: monthlyTotal._count,
    },
  };
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  getTransactionSummary,
  recordCreditPayment,
};