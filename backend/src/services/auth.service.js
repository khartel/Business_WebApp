const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");
const { generateToken } = require("../utils/jwt.utils");
const { getCurrencyForCountry } = require("../utils/currencies");
const AppError = require("../utils/AppError");

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
    throw new AppError("Username is already taken", 409);
  }

  // Check if email already exists (only if provided)
  if (cleanEmail) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      throw new AppError("Email is already registered", 409);
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
    throw new AppError("Invalid username or password", 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid username or password", 401);
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
    throw new AppError("User not found", 404);
  }

  // Build the same normalized `businesses` array shape as loginUser, so the
  // frontend can rely on it regardless of whether the session came from a
  // fresh login or a /auth/me refetch (e.g. after a page reload).
  let businesses = [];

  if (user.role === "SUPERADMIN") {
    businesses = user.ownedBusinesses;
  } else {
    businesses = user.businessUsers.map((bu) => ({
      id: bu.business.id,
      name: bu.business.name,
      country: bu.business.country,
      currency: bu.business.currency,
      location: bu.business.location,
      roleInBusiness: bu.role,
    }));
  }

  const { ownedBusinesses, businessUsers, ...userWithoutRaw } = user;

  return {
    ...userWithoutRaw,
    businesses,
  };
};

/**
 * Update user password
 */
const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  return true;
};

/**
 * Update the current user's own profile fields (fullName, phone, email).
 * All fields are optional/partial - only provided ones are updated.
 */
const updateProfile = async (userId, { fullName, phone, email }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const data = {};
  if (fullName !== undefined) data.fullName = fullName;
  if (phone !== undefined) data.phone = phone;

  if (email !== undefined) {
    const cleanEmail = email.trim() !== "" ? email.trim() : null;
    if (cleanEmail && cleanEmail !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existingEmail) {
        throw new AppError("Email is already registered", 409);
      }
    }
    data.email = cleanEmail;
  }

  await prisma.user.update({ where: { id: userId }, data });

  return getMe(userId);
};

module.exports = {
  registerSuperAdmin,
  loginUser,
  getMe,
  updatePassword,
  updateProfile,
};