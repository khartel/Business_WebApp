const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");
const { generateToken } = require("../utils/jwt.utils");
const { getCurrencyForCountry } = require("../utils/currencies");

/**
 * Register a new SuperAdmin
 */
const registerSuperAdmin = async ({ fullName, username, phone, email, password }) => {
  // Clean email
  const cleanEmail = email && email.trim() !== "" ? email.trim() : null;

  // Check if username already exists
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    throw new Error("Username is already taken");
  }

  // Check if email already exists (only if provided)
  if (cleanEmail) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      throw new Error("Email is already registered");
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create the user
  const user = await prisma.user.create({
    data: {
      fullName,
      username,
      phone,
      email: cleanEmail,  // null if not provided
      passwordHash,
      role: "SUPERADMIN",
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      phone: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Login any user (SuperAdmin, Admin, Employee)
 */
const loginUser = async ({ username, password, rememberMe = false }) => {
  // Find user by username
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      businessUsers: {
        include: {
          business: {
            select: {
              id: true,
              name: true,
              country: true,
              currency: true,
              location: true,
            },
          },
        },
      },
      ownedBusinesses: {
        select: {
          id: true,
          name: true,
          country: true,
          currency: true,
          location: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Invalid username or password");
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid username or password");
  }

  // Generate token
  const token = generateToken(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    rememberMe
  );

  // Build businesses list depending on role
  let businesses = [];

  if (user.role === "SUPERADMIN") {
    businesses = user.ownedBusinesses;
  } else {
    // Map businessUsers to a clean businesses array
    businesses = user.businessUsers.map((bu) => ({
      id: bu.business.id,
      name: bu.business.name,
      country: bu.business.country,
      currency: bu.business.currency,
      location: bu.business.location,
      businessUserId: bu.id,
      roleInBusiness: bu.role,
    }));
  }

  // Remove passwordHash from response
  const { passwordHash, businessUsers, ownedBusinesses, ...userWithoutPassword } = user;

  return {
    token,
    user: {
      ...userWithoutPassword,
      businesses,
    },
  };
};

/**
 * Get current logged in user profile
 */
const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      username: true,
      phone: true,
      email: true,
      role: true,
      createdAt: true,
      ownedBusinesses: {
        select: {
          id: true,
          name: true,
          country: true,
          currency: true,
          location: true,
        },
      },
      businessUsers: {
        select: {
          role: true,
          business: {
            select: {
              id: true,
              name: true,
              country: true,
              currency: true,
              location: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

module.exports = {
  registerSuperAdmin,
  loginUser,
  getMe,
};