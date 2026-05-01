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

  // Delete user - Prisma will handle the rest via cascading deletes defined in schema.prisma
  await prisma.user.delete({ where: { id: userId } });

  return true;
};

module.exports = { fetchAllSuperAdmins, removeSuperAdmin };