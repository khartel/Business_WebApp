const prisma = require("../utils/prisma");

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
    throw new Error(
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
        throw new Error(`Product not found: ${item.productId}`);
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
        throw new Error(
          `Insufficient stock for "${product.name}". ` +
          `Available: ${stock ? stock.quantity : 0} ${product.unit}, ` +
          `Requested: ${item.quantitySold} ${product.unit}`
        );
      }

      if (item.quantitySold <= 0) {
        throw new Error(`Quantity for "${product.name}" must be greater than 0`);
      }

      if (item.unitPrice <= 0) {
        throw new Error(`Price for "${product.name}" must be greater than 0`);
      }

      return {
        productId: item.productId,
        productName: product.name,
        quantitySold: item.quantitySold,
        unitPrice: item.unitPrice,
        subtotal: item.quantitySold * item.unitPrice,
        currentStock: stock.quantity,
      };
    })
  );

  const totalAmount = itemsWithDetails.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  const transaction = await prisma.$transaction(async (tx) => {
    const newTransaction = await tx.transaction.create({
      data: {
        businessId,
        warehouseId: primaryWarehouse.id,
        performedById,
        paymentMethod,
        totalAmount,
        customerName: customerName || "Casual Customer",
        notes,
        items: {
          create: itemsWithDetails.map((item) => ({
            productId: item.productId,
            quantitySold: item.quantitySold,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
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
            role: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            isPrimary: true,
          },
        },
      },
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

  return transaction;
};

/**
 * Get all transactions for a business
 * with optional filters
 */
const getTransactions = async ({
  businessId,
  performedById,
  paymentMethod,
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
          role: true,
        },
      },
      warehouse: {
        select: {
          id: true,
          name: true,
          isPrimary: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    transactions,
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
          role: true,
        },
      },
      warehouse: {
        select: {
          id: true,
          name: true,
          isPrimary: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
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
};