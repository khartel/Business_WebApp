const {
  fetchAllSuperAdmins,
  removeSuperAdmin,
  resetSuperAdminPassword,
} = require("../services/superadmin.service");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/platform/superadmins
 * Platform/support endpoint (see superadmin.routes.js — master-key gated,
 * not a normal session). Lists every SuperAdmin account along with a summary
 * of the businesses each one owns.
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
 * Platform/support endpoint (master-key gated). Permanently deletes a
 * SuperAdmin account; Prisma's cascading relations then delete everything
 * that account owns — businesses, products, transactions, team members,
 * warehouses, etc. This is irreversible.
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
