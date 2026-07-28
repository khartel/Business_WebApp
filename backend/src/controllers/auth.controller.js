const {
  registerSuperAdmin,
  loginUser,
  getMe,
  updatePassword,
  updateProfile: updateProfileService,
} = require("../services/auth.service");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * POST /api/auth/register
 * Register a new SuperAdmin
 */
const register = asyncHandler(async (req, res) => {
  const { fullName, username, phone, email, password } = req.body;

  const user = await registerSuperAdmin({ fullName, username, phone, email, password });

  return sendSuccess(res, {
    message: "Account created successfully. Please log in.",
    data: user,
    statusCode: 201,
  });
});

/**
 * POST /api/auth/login
 * Login any user
 */
const login = asyncHandler(async (req, res) => {
  const { username, password, rememberMe } = req.body;

  const { token, user } = await loginUser({ username, password, rememberMe });

  // Token is only ever sent via httpOnly cookie — never in the JSON body —
  // so it can't be read or exfiltrated by client-side JS.
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: rememberMe
      ? 30 * 24 * 60 * 60 * 1000  // 30 days
      : 24 * 60 * 60 * 1000,       // 24 hours
  });

  return sendSuccess(res, {
    message: "Login successful",
    data: { user },
  });
});

/**
 * POST /api/auth/logout
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");

  return sendSuccess(res, {
    message: "Logged out successfully",
  });
});

/**
 * GET /api/auth/me
 * Get current logged in user
 */
const me = asyncHandler(async (req, res) => {
  const user = await getMe(req.user.id);

  return sendSuccess(res, {
    message: "User profile fetched",
    data: user,
  });
});

/**
 * POST /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await updatePassword(req.user.id, currentPassword, newPassword);

  return sendSuccess(res, {
    message: "Password updated successfully",
  });
});

/**
 * PATCH /api/auth/me
 * Update the current user's own profile (fullName, phone, email)
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, email } = req.body;

  const user = await updateProfileService(req.user.id, { fullName, phone, email });

  return sendSuccess(res, {
    message: "Profile updated successfully",
    data: user,
  });
});

module.exports = { register, login, logout, me, changePassword, updateProfile };
