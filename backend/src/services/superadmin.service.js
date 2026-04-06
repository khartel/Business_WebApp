const prisma = require("../utils/prisma");

/**
 * Get all superadmins with their businesses
 */
const fetchAllSuperAdmins = async () => {
  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPERADMIN" },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      phone: true,
      createdAt: true,
      ownedBusinesses: {
        select: {
          id: true,
          name: true,
          country: true,
          currency: true,
          createdAt: true,
          _count: {
            select: {
              transactions: true,
              products: true,
              warehouses: true,
              businessUsers: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return superAdmins;
};

/**
 * Delete a superadmin and all their data
 */
const removeSuperAdmin = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedBusinesses: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "SUPERADMIN") {
    throw new Error("User is not a SuperAdmin");
  }

  // Delete everything in a transaction
  await prisma.$transaction(async (tx) => {
    // For each business, cascade delete
    for (const business of user.ownedBusinesses) {
      const businessId = business.id;

      // Delete transaction items first
      await tx.transactionItem.deleteMany({
        where: { transaction: { businessId } },
      });

      // Delete transactions
      await tx.transaction.deleteMany({ where: { businessId } });

      // Delete stock movements
      await tx.stockMovement.deleteMany({ where: { businessId } });

      // Delete warehouse stock
      await tx.warehouseStock.deleteMany({
        where: { warehouse: { businessId } },
      });

      // Delete warehouses
      await tx.warehouse.deleteMany({ where: { businessId } });

      // Delete products
      await tx.product.deleteMany({ where: { businessId } });

      // Delete business users
      await tx.businessUser.deleteMany({ where: { businessId } });

      // Delete business
      await tx.business.delete({ where: { id: businessId } });
    }

    // Delete user's stock movements as movedBy
    await tx.stockMovement.deleteMany({ where: { movedById: userId } });

    // Delete user's transactions as performedBy
    await tx.transaction.deleteMany({ where: { performedById: userId } });

    // Delete business user entries
    await tx.businessUser.deleteMany({ where: { userId } });

    // Finally delete the user
    await tx.user.delete({ where: { id: userId } });
  });

  return true;
};

module.exports = { fetchAllSuperAdmins, removeSuperAdmin };