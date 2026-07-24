const {
  fetchAllSuperAdmins,
  removeSuperAdmin,
  resetSuperAdminPassword,
} = require("../services/superadmin.service");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/platform/superadmins
 */
const getAllSuperAdmins = asyncHandler(async (req, res) => {
  const superAdmins = await fetchAllSuperAdmins();
  return sendSuccess(res, {
    message: "SuperAdmins fetched successfully",
    data: superAdmins,
  });
});

/**
 * DELETE /api/platform/superadmins/:userId
 */
const deleteSuperAdmin = asyncHandler(async (req, res) => {
  await removeSuperAdmin(req.params.userId);
  return sendSuccess(res, {
    message: "SuperAdmin deleted successfully",
  });
});

/**
 * POST /api/platform/superadmins/:userId/reset-password
 * Developer/support action: reset a SuperAdmin's password directly,
 * replacing the old reset_password.js one-off script.
 */
const resetPassword = asyncHandler(async (req, res) => {
  const result = await resetSuperAdminPassword(req.params.userId);
  return sendSuccess(res, {
    message: `Password reset for ${result.username}. New password: ${result.newPassword}`,
    data: result,
  });
});

module.exports = { getAllSuperAdmins, deleteSuperAdmin, resetPassword };
