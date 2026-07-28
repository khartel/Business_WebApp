const prisma = require("../utils/prisma");
const { getCurrencyForCountry } = require("../utils/currencies");
const AppError = require("../utils/AppError");

/**
 * Create a new business (SuperAdmin only)
 */
const createBusiness = async ({ name, phone, email, country, location, ownerId }) => {
  // Get currency based on country
  const currency = getCurrencyForCountry(country);

  // Create the business
  const business = await prisma.business.create({
    data: {
      name,
      phone,
      email,
      country,
      location,
      currency: currency.code,
      ownerId,
    },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          username: true,
          phone: true,
          email: true,
        },
      },
      _count: {
        select: {
          businessUsers: true,
          warehouses: true,
          products: true,
        },
      },
    },
  });

  // Also add the superadmin as a BusinessUser with SUPERADMIN role
  // This makes querying easier later
  await prisma.businessUser.create({
    data: {
      businessId: business.id,
      userId: ownerId,
      role: "SUPERADMIN",
    },
  });

  return {
    ...business,
    currencyDetails: currency,
  };
};

/**
 * Get all businesses owned by a SuperAdmin
 */
const getMyBusinesses = async (ownerId) => {
  const businesses = await prisma.business.findMany({
    where: { ownerId },
    include: {
      _count: {
        select: {
          businessUsers: true,
          warehouses: true,
          products: true,
          transactions: true,
        },
      },
      warehouses: {
        where: { isPrimary: true },
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return businesses;
};

/**
 * Get a single business by ID
 */
const getBusinessById = async (businessId, userId, role) => {
  let business;

  if (role === "SUPERADMIN") {
    business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
            phone: true,
            email: true,
          },
        },
        warehouses: {
          include: {
            _count: {
              select: { stock: true },
            },
          },
          orderBy: [
            { isPrimary: "desc" },
            { createdAt: "asc" },
          ],
        },
        businessUsers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                phone: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            businessUsers: true,
            warehouses: true,
            products: true,
            transactions: true,
          },
        },
      },
    });
  } else {
    // Admin or Employee — must be linked to business
    const businessUser = await prisma.businessUser.findFirst({
      where: { businessId, userId },
      include: {
        business: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                username: true,
                phone: true,
                email: true,
              },
            },
            warehouses: {
              include: {
                _count: {
                  select: { stock: true },
                },
              },
              orderBy: [
                { isPrimary: "desc" },
                { createdAt: "asc" },
              ],
            },
            businessUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    username: true,
                    phone: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
            _count: {
              select: {
                businessUsers: true,
                warehouses: true,
                products: true,
                transactions: true,
              },
            },
          },
        },
      },
    });

    business = businessUser?.business;
  }

  if (!business) {
    throw new AppError("Business not found or access denied", 404);
  }

  return business;
};

/**
 * Update a business
 */
const updateBusiness = async (businessId, ownerId, { name, phone, email, location }) => {
  // Make sure this business belongs to this owner
  const existing = await prisma.business.findFirst({
    where: { id: businessId, ownerId },
  });

  if (!existing) {
    throw new Error("Business not found or access denied");
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(email && { email }),
      ...(location && { location }),
    },
  });

  return updated;
};

/**
 * Delete a business and everything under it (products, warehouses, sales, team access)
 */
const deleteBusiness = async (businessId, ownerId) => {
  const existing = await prisma.business.findFirst({
    where: { id: businessId, ownerId },
  });

  if (!existing) {
    throw new AppError("Business not found or access denied", 404);
  }

  await prisma.business.delete({ where: { id: businessId } });

  return { message: "Business deleted successfully" };
};

module.exports = {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
};