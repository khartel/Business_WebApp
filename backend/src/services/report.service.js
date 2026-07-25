const prisma = require("../utils/prisma");
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, eachWeekOfInterval } = require("date-fns");

/**
 * Helper to build date range
 */
const buildDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();

  return {
    gte: startOfDay(start),
    lte: endOfDay(end),
  };
};

/**
 * Daily Report
 * Full breakdown of a single day
 */
const getDailyReport = async (businessId, date) => {
  const targetDate = date ? new Date(date) : new Date();

  const dateRange = {
    gte: startOfDay(targetDate),
    lte: endOfDay(targetDate),
  };

  // Get all transactions for the day
  const transactions = await prisma.transaction.findMany({
    where: {
      businessId,
      createdAt: dateRange,
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
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Total summary
  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTransactions = transactions.length;

  // By payment method
  const cashTransactions = transactions.filter((t) => t.paymentMethod === "CASH");
  const transferTransactions = transactions.filter((t) => t.paymentMethod === "TRANSFER");

  const cashTotal = cashTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const transferTotal = transferTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

  // By employee
  const employeeMap = {};
  transactions.forEach((t) => {
    const key = t.performedById;
    if (!employeeMap[key]) {
      employeeMap[key] = {
        employee: t.performedBy,
        totalAmount: 0,
        transactionCount: 0,
        cashAmount: 0,
        transferAmount: 0,
        transactions: [],
      };
    }
    employeeMap[key].totalAmount += t.totalAmount;
    employeeMap[key].transactionCount += 1;
    employeeMap[key].transactions.push(t);

    if (t.paymentMethod === "CASH") {
      employeeMap[key].cashAmount += t.totalAmount;
    } else if (t.paymentMethod === "TRANSFER") {
      employeeMap[key].transferAmount += t.totalAmount;
    }
  });

  // By product
  const productMap = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const key = item.productId;
      if (!productMap[key]) {
        productMap[key] = {
          product: item.product,
          totalQuantity: 0,
          totalRevenue: 0,
          timesSold: 0,
        };
      }
      productMap[key].totalQuantity += item.quantitySold;
      productMap[key].totalRevenue += item.subtotal;
      productMap[key].timesSold += 1;
    });
  });

  return {
    date: format(targetDate, "yyyy-MM-dd"),
    summary: {
      totalAmount,
      totalTransactions,
      cashTotal,
      cashTransactions: cashTransactions.length,
      transferTotal,
      transferTransactions: transferTransactions.length,
    },
    transactions,
    byEmployee: Object.values(employeeMap).sort(
      (a, b) => b.totalAmount - a.totalAmount
    ),
    byProduct: Object.values(productMap).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    ),
  };
};

/**
 * Weekly Report
 * Breakdown by day for a week
 */
const getWeeklyReport = async (businessId, date) => {
  const targetDate = date ? new Date(date) : new Date();
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });     // Sunday

  // Get all transactions for the week
  const transactions = await prisma.transaction.findMany({
    where: {
      businessId,
      createdAt: {
        gte: weekStart,
        lte: weekEnd,
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
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const dailyBreakdown = days.map((day) => {
    const dayTransactions = transactions.filter((t) => {
      const transDate = new Date(t.createdAt);
      return (
        transDate >= startOfDay(day) && transDate <= endOfDay(day)
      );
    });

    return {
      date: format(day, "yyyy-MM-dd"),
      dayName: format(day, "EEEE"),
      totalAmount: dayTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
      transactionCount: dayTransactions.length,
      cashTotal: dayTransactions
        .filter((t) => t.paymentMethod === "CASH")
        .reduce((sum, t) => sum + t.totalAmount, 0),
      transferTotal: dayTransactions
        .filter((t) => t.paymentMethod === "TRANSFER")
        .reduce((sum, t) => sum + t.totalAmount, 0),
    };
  });

  // Overall week totals
  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTransactions = transactions.length;

  // Best day of the week
  const bestDay = dailyBreakdown.reduce(
    (best, day) => (day.totalAmount > best.totalAmount ? day : best),
    dailyBreakdown[0]
  );

  // By employee for the week
  const employeeMap = {};
  transactions.forEach((t) => {
    const key = t.performedById;
    if (!employeeMap[key]) {
      employeeMap[key] = {
        employee: t.performedBy,
        totalAmount: 0,
        transactionCount: 0,
      };
    }
    employeeMap[key].totalAmount += t.totalAmount;
    employeeMap[key].transactionCount += 1;
  });

  // By product for the week
  const productMap = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const key = item.productId;
      if (!productMap[key]) {
        productMap[key] = {
          product: item.product,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      productMap[key].totalQuantity += item.quantitySold;
      productMap[key].totalRevenue += item.subtotal;
    });
  });

  return {
    weekStart: format(weekStart, "yyyy-MM-dd"),
    weekEnd: format(weekEnd, "yyyy-MM-dd"),
    summary: {
      totalAmount,
      totalTransactions,
      cashTotal: transactions
        .filter((t) => t.paymentMethod === "CASH")
        .reduce((sum, t) => sum + t.totalAmount, 0),
      transferTotal: transactions
        .filter((t) => t.paymentMethod === "TRANSFER")
        .reduce((sum, t) => sum + t.totalAmount, 0),
      bestDay,
    },
    dailyBreakdown,
    byEmployee: Object.values(employeeMap).sort(
      (a, b) => b.totalAmount - a.totalAmount
    ),
    byProduct: Object.values(productMap).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    ),
  };
};

/**
 * Monthly Report
 * Breakdown by week and day for a month
 */
const getMonthlyReport = async (businessId, year, month) => {
  const targetDate = new Date(
    year || new Date().getFullYear(),
    (month || new Date().getMonth() + 1) - 1,
    1
  );

  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  // Get all transactions for the month
  const transactions = await prisma.transaction.findMany({
    where: {
      businessId,
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
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
    orderBy: { createdAt: "asc" },
  });

  // Group by day for the whole month
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dailyBreakdown = days.map((day) => {
    const dayTransactions = transactions.filter((t) => {
      const transDate = new Date(t.createdAt);
      return (
        transDate >= startOfDay(day) && transDate <= endOfDay(day)
      );
    });

    return {
      date: format(day, "yyyy-MM-dd"),
      dayName: format(day, "EEE"),
      totalAmount: dayTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
      transactionCount: dayTransactions.length,
    };
  });

  // Overall month totals
  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTransactions = transactions.length;

  // Average daily sales
  const avgDailySales = totalAmount / days.length;

  // Best day of the month
  const bestDay = dailyBreakdown.reduce(
    (best, day) => (day.totalAmount > best.totalAmount ? day : best),
    dailyBreakdown[0]
  );

  // By employee for the month
  const employeeMap = {};
  transactions.forEach((t) => {
    const key = t.performedById;
    if (!employeeMap[key]) {
      employeeMap[key] = {
        employee: t.performedBy,
        totalAmount: 0,
        transactionCount: 0,
        cashAmount: 0,
        transferAmount: 0,
      };
    }
    employeeMap[key].totalAmount += t.totalAmount;
    employeeMap[key].transactionCount += 1;

    if (t.paymentMethod === "CASH") {
      employeeMap[key].cashAmount += t.totalAmount;
    } else if (t.paymentMethod === "TRANSFER") {
      employeeMap[key].transferAmount += t.totalAmount;
    }
  });

  // By product for the month
  const productMap = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const key = item.productId;
      if (!productMap[key]) {
        productMap[key] = {
          product: item.product,
          totalQuantity: 0,
          totalRevenue: 0,
          timesSold: 0,
        };
      }
      productMap[key].totalQuantity += item.quantitySold;
      productMap[key].totalRevenue += item.subtotal;
      productMap[key].timesSold += 1;
    });
  });

  return {
    month: format(targetDate, "MMMM yyyy"),
    monthStart: format(monthStart, "yyyy-MM-dd"),
    monthEnd: format(monthEnd, "yyyy-MM-dd"),
    summary: {
      totalAmount,
      totalTransactions,
      avgDailySales,
      cashTotal: transactions
        .filter((t) => t.paymentMethod === "CASH")
        .reduce((sum, t) => sum + t.totalAmount, 0),
      transferTotal: transactions
        .filter((t) => t.paymentMethod === "TRANSFER")
        .reduce((sum, t) => sum + t.totalAmount, 0),
      bestDay,
    },
    dailyBreakdown,
    byEmployee: Object.values(employeeMap).sort(
      (a, b) => b.totalAmount - a.totalAmount
    ),
    byProduct: Object.values(productMap).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    ),
  };
};

/**
 * Employee Report
 * Sales performance per employee
 */
const getEmployeeReport = async (businessId, startDate, endDate) => {
  const dateRange = buildDateRange(startDate, endDate);

  // Single pass: fetch team members and all in-range transactions once,
  // then group in memory instead of firing one query per employee.
  const [teamMembers, transactions] = await Promise.all([
    prisma.businessUser.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
          },
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        businessId,
        createdAt: dateRange,
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
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const transactionsByEmployee = {};
  transactions.forEach((t) => {
    if (!transactionsByEmployee[t.performedById]) {
      transactionsByEmployee[t.performedById] = [];
    }
    transactionsByEmployee[t.performedById].push(t);
  });

  const employeeReports = teamMembers.map((member) => {
    const memberTransactions = transactionsByEmployee[member.userId] || [];

    const totalAmount = memberTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const cashTotal = memberTransactions
      .filter((t) => t.paymentMethod === "CASH")
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const transferTotal = memberTransactions
      .filter((t) => t.paymentMethod === "TRANSFER")
      .reduce((sum, t) => sum + t.totalAmount, 0);

    // Products sold by this employee
    const productMap = {};
    memberTransactions.forEach((t) => {
      t.items.forEach((item) => {
        const key = item.productId;
        if (!productMap[key]) {
          productMap[key] = {
            product: item.product,
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        productMap[key].totalQuantity += item.quantitySold;
        productMap[key].totalRevenue += item.subtotal;
      });
    });

    return {
      employee: member.user,
      businessRole: member.role,
      summary: {
        totalAmount,
        transactionCount: memberTransactions.length,
        cashTotal,
        transferTotal,
      },
      topProducts: Object.values(productMap).sort(
        (a, b) => b.totalRevenue - a.totalRevenue
      ),
      transactions: memberTransactions,
    };
  });

  return {
    startDate: format(new Date(dateRange.gte), "yyyy-MM-dd"),
    endDate: format(new Date(dateRange.lte), "yyyy-MM-dd"),
    employees: employeeReports.sort(
      (a, b) => b.summary.totalAmount - a.summary.totalAmount
    ),
  };
};

/**
 * Product Report
 * Best and worst selling products
 */
const getProductReport = async (businessId, startDate, endDate) => {
  const dateRange = buildDateRange(startDate, endDate);

  const transactionItems = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        businessId,
        createdAt: dateRange,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          unit: true,
          description: true,
        },
      },
      transaction: {
        select: {
          createdAt: true,
          paymentMethod: true,
        },
      },
    },
  });

  // Group by product
  const productMap = {};
  transactionItems.forEach((item) => {
    const key = item.productId;
    if (!productMap[key]) {
      productMap[key] = {
        product: item.product,
        totalQuantity: 0,
        totalRevenue: 0,
        timesSold: 0,
        avgUnitPrice: 0,
        prices: [],
      };
    }
    productMap[key].totalQuantity += item.quantitySold;
    productMap[key].totalRevenue += item.subtotal;
    productMap[key].timesSold += 1;
    productMap[key].prices.push(item.unitPrice);
  });

  // Calculate average price for each product
  const products = Object.values(productMap).map((p) => ({
    ...p,
    avgUnitPrice:
      p.prices.reduce((sum, price) => sum + price, 0) / p.prices.length,
    prices: undefined, // Remove prices array from response
  }));

  // Get current stock for all products in a single query instead of one per product
  const productIds = products.map((p) => p.product.id);
  const allStock = await prisma.warehouseStock.findMany({
    where: { productId: { in: productIds } },
    include: {
      warehouse: {
        select: {
          id: true,
          name: true,
          isPrimary: true,
        },
      },
    },
  });

  const stockByProduct = {};
  allStock.forEach((s) => {
    if (!stockByProduct[s.productId]) {
      stockByProduct[s.productId] = [];
    }
    stockByProduct[s.productId].push(s);
  });

  const productsWithStock = products.map((p) => {
    const stock = stockByProduct[p.product.id] || [];
    const totalStock = stock.reduce((sum, s) => sum + s.quantity, 0);

    return {
      ...p,
      currentStock: {
        total: totalStock,
        byWarehouse: stock,
      },
    };
  });

  return {
    startDate: format(new Date(dateRange.gte), "yyyy-MM-dd"),
    endDate: format(new Date(dateRange.lte), "yyyy-MM-dd"),
    totalProducts: productsWithStock.length,
    bestSelling: productsWithStock.sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    ),
    mostQuantitySold: [...productsWithStock].sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    ),
  };
};

/**
 * Stock Alert Report
 * Low stock and out of stock items
 */
const getStockAlertReport = async (businessId) => {
  const stock = await prisma.warehouseStock.findMany({
    where: {
      warehouse: { businessId },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          unit: true,
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
    orderBy: { quantity: "asc" },
  });

  const outOfStock = stock.filter((s) => s.quantity === 0);
  const lowStock = stock.filter(
    (s) => s.quantity > 0 && s.quantity <= s.lowStockThreshold
  );
  const healthyStock = stock.filter(
    (s) => s.quantity > s.lowStockThreshold
  );

  return {
    summary: {
      totalItems: stock.length,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      healthyCount: healthyStock.length,
    },
    outOfStock,
    lowStock,
    healthyStock,
  };
};

module.exports = {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getEmployeeReport,
  getProductReport,
  getStockAlertReport,
};