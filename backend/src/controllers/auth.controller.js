const { registerSuperAdmin, loginUser, getMe, updatePassword } = require("../services/auth.service");
const { sendSuccess, sendError } = require("../utils/response.utils");

/**
 * POST /api/auth/register
 * Register a new SuperAdmin
 */
const register = async (req, res) => {
  try {
    const { fullName, username, phone, email, password } = req.body;

    // Basic validation
    if (!fullName || !username || !phone || !password) {
      return sendError(res, {
        message: "Full name, username, phone and password are required",
        statusCode: 400,
      });
    }

    if (password.length < 6) {
      return sendError(res, {
        message: "Password must be at least 6 characters",
        statusCode: 400,
      });
    }

    const user = await registerSuperAdmin({ fullName, username, phone, email, password });

    return sendSuccess(res, {
      message: "Account created successfully. Please log in.",
      data: user,
      statusCode: 201,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Registration failed",
      statusCode: 400,
    });
  }
};

/**
 * POST /api/auth/login
 * Login any user
 */
const login = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return sendError(res, {
        message: "Username and password are required",
        statusCode: 400,
      });
    }

    const { token, user } = await loginUser({ username, password, rememberMe });

    // Set token in cookie as well (for browser clients)
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
      data: { token, user },
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Login failed",
      statusCode: 401,
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout user
 */
const logout = async (req, res) => {
  try {
    res.clearCookie("token");

    return sendSuccess(res, {
      message: "Logged out successfully",
    });
  } catch (error) {
    return sendError(res, {
      message: "Logout failed",
      statusCode: 500,
    });
  }
};

/**
 * GET /api/auth/me
 * Get current logged in user
 */
const me = async (req, res) => {
  try {
    const user = await getMe(req.user.id);

    return sendSuccess(res, {
      message: "User profile fetched",
      data: user,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch profile",
      statusCode: 400,
    });
  }
};

/**
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, {
        message: "Current and new passwords are required",
        statusCode: 400,
      });
    }

    await updatePassword(req.user.id, currentPassword, newPassword);

    return sendSuccess(res, {
      message: "Password updated successfully",
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not update password",
      statusCode: 400,
    });
  }
};

module.exports = { register, login, logout, me, changePassword };