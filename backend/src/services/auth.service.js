const bcrypt = require("bcryptjs");
const { generateSecret, verify, generateURI } = require("otplib");
const QRCode = require("qrcode");
const prisma = require("../utils/prisma");
const { generateToken, verifyToken, generateShortLivedToken } = require("../utils/jwt.utils");
const { getCurrencyForCountry } = require("../utils/currencies");
const AppError = require("../utils/AppError");

/**
 * Fields of a Business that are safe/relevant to expose to a logged-in user
 * (e.g. as part of their session's `businesses` list or receipt settings).
 * Centralized so every place that needs a lightweight business shape stays
 * in sync instead of hand-picking fields in multiple queries.
 */
const BUSINESS_SELECT = {
  id: true,
  name: true,
  country: true,
  currency: true,
  location: true,
  receiptTitle: true,
  receiptFooterNote: true,
  receiptShowSignature: true,
};

/**
 * Prisma `include` shape for loading a User together with every business
 * they can access: businesses they own (SuperAdmin) via `ownedBusinesses`,
 * and businesses they've been added to as staff via `businessUsers`. Used
 * anywhere a full session/profile needs to be reconstructed (login, 2FA
 * verification, /me).
 */
const USER_WITH_BUSINESSES_INCLUDE = {
  businessUsers: {
    include: {
      business: { select: BUSINESS_SELECT },
    },
  },
  ownedBusinesses: {
    select: BUSINESS_SELECT,
  },
};

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
 * Builds the final session (JWT + normalized user/businesses shape) for a
 * fully-authenticated user - i.e. password verified, and 2FA verified too
 * if the account has it enabled. Shared by the direct login path and the
 * 2FA-verify path so both produce an identical session shape.
 */
const issueSession = (user, rememberMe) => {
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
      receiptTitle: bu.business.receiptTitle,
      receiptFooterNote: bu.business.receiptFooterNote,
      receiptShowSignature: bu.business.receiptShowSignature,
      businessUserId: bu.id,
      roleInBusiness: bu.role,
    }));
  }

  // Remove passwordHash/2FA secret from response
  const { passwordHash, twoFactorSecret, businessUsers, ownedBusinesses, ...userWithoutPassword } = user;

  return {
    token,
    user: {
      ...userWithoutPassword,
      businesses,
    },
  };
};

/**
 * Login any user (SuperAdmin, Admin, Employee)
 */
const loginUser = async ({ username, password, rememberMe = false }) => {
  // Find user by username
  const user = await prisma.user.findUnique({
    where: { username },
    include: USER_WITH_BUSINESSES_INCLUDE,
  });

  if (!user) {
    throw new AppError("Invalid username or password", 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid username or password", 401);
  }

  // If 2FA is enabled, don't issue a real session yet - only a short-lived
  // token identifying who's mid-login, to be exchanged for a session once
  // they provide a valid authenticator code.
  if (user.twoFactorEnabled) {
    const tempToken = generateShortLivedToken(
      { id: user.id, purpose: "2fa-pending", rememberMe },
      "5m"
    );
    return { requires2FA: true, tempToken };
  }

  return issueSession(user, rememberMe);
};

/**
 * Completes login for an account with 2FA enabled: verifies the short-lived
 * tempToken from the password step, then the TOTP code, then issues a real
 * session identical in shape to a normal (non-2FA) login.
 */
const verifyLoginTwoFactor = async (tempToken, code) => {
  let payload;
  try {
    payload = verifyToken(tempToken);
  } catch {
    throw new AppError("Your session expired. Please log in again.", 401);
  }

  if (payload.purpose !== "2fa-pending") {
    throw new AppError("Invalid session. Please log in again.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: USER_WITH_BUSINESSES_INCLUDE,
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError("Invalid session. Please log in again.", 401);
  }

  const result = await verify({ secret: user.twoFactorSecret, token: code, tolerance: 30 });
  if (!result.valid) {
    throw new AppError("Invalid authentication code", 401);
  }

  const rememberMe = payload.rememberMe ?? false;
  return { ...issueSession(user, rememberMe), rememberMe };
};

/**
 * Fetches the current logged-in user's profile for the /auth/me endpoint,
 * used to rehydrate a session client-side (e.g. after a page reload) without
 * requiring a fresh login.
 *
 * @param {string} userId - ID of the authenticated user.
 * @returns {Promise<object>} The user (minus password/2FA secret) with a
 *   normalized `businesses` array built the same way as `issueSession`, so
 *   the frontend can treat a fresh login and a /me refetch identically.
 * @throws {AppError} 404 if the user no longer exists.
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
      twoFactorEnabled: true,
      createdAt: true,
      ownedBusinesses: {
        select: {
          id: true,
          name: true,
          country: true,
          currency: true,
          location: true,
          receiptTitle: true,
          receiptFooterNote: true,
          receiptShowSignature: true,
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
              receiptTitle: true,
              receiptFooterNote: true,
              receiptShowSignature: true,
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
      receiptTitle: bu.business.receiptTitle,
      receiptFooterNote: bu.business.receiptFooterNote,
      receiptShowSignature: bu.business.receiptShowSignature,
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
 * Changes a logged-in user's own password. Requires the current password as
 * proof of identity, and clears `mustChangePassword` so a user who was
 * issued a temporary/forced password (e.g. new team member, post-reset)
 * is no longer nagged to change it after doing so voluntarily.
 *
 * @param {string} userId - ID of the user changing their password.
 * @param {string} currentPassword - Plaintext current password to verify.
 * @param {string} newPassword - Plaintext new password to hash and store.
 * @returns {Promise<boolean>} true on success.
 * @throws {AppError} 404 if user not found, 401 if currentPassword is wrong.
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
 *
 * @param {string} userId - ID of the user being updated.
 * @param {{fullName?: string, phone?: string, email?: string}} fields -
 *   Partial profile fields. An empty-string email is normalized to null;
 *   a changed, non-empty email is checked for uniqueness across all users
 *   before being saved.
 * @returns {Promise<object>} The refreshed profile, same shape as `getMe`.
 * @throws {AppError} 404 if user not found, 409 if the new email is already
 *   registered to another account.
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

/**
 * Begins 2FA setup: generates a new secret (stored but not yet enabled),
 * and returns a QR code + the raw secret as a manual-entry fallback.
 */
const setupTwoFactor = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const secret = generateSecret();

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  const otpauthUrl = generateURI({ issuer: "D-Inventory", label: user.username, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { secret, qrCodeDataUrl };
};

/**
 * Confirms 2FA setup by verifying a code against the pending secret, then
 * flips twoFactorEnabled on.
 */
const verifyTwoFactorSetup = async (userId, code) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.twoFactorSecret) {
    throw new AppError("No 2FA setup in progress. Please start setup again.", 400);
  }

  const result = await verify({ secret: user.twoFactorSecret, token: code, tolerance: 30 });
  if (!result.valid) {
    throw new AppError("Invalid code. Please try again.", 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  return true;
};

/**
 * Disables 2FA. Requires the current password since this is a sensitive
 * security action that shouldn't be doable from just a live session.
 */
const disableTwoFactor = async (userId, password) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: null, twoFactorEnabled: false },
  });

  return true;
};

module.exports = {
  registerSuperAdmin,
  loginUser,
  verifyLoginTwoFactor,
  getMe,
  updatePassword,
  updateProfile,
  setupTwoFactor,
  verifyTwoFactorSetup,
  disableTwoFactor,
};