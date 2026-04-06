const {
  fetchAllSuperAdmins,
  removeSuperAdmin,
} = require("../services/superadmin.service");
const { sendSuccess, sendError } = require("../utils/response.utils");

/**
 * GET /api/platform/superadmins
 */
const getAllSuperAdmins = async (req, res) => {
  try {
    const superAdmins = await fetchAllSuperAdmins();
    return sendSuccess(res, {
      message: "SuperAdmins fetched successfully",
      data: superAdmins,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch superadmins",
      statusCode: 500,
    });
  }
};

/**
 * DELETE /api/platform/superadmins/:userId
 */
const deleteSuperAdmin = async (req, res) => {
  try {
    await removeSuperAdmin(req.params.userId);
    return sendSuccess(res, {
      message: "SuperAdmin deleted successfully",
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not delete superadmin",
      statusCode: 400,
    });
  }
};

module.exports = { getAllSuperAdmins, deleteSuperAdmin };