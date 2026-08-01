const { listAuditLog } = require("../services/audit-log.service");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/businesses/:businessId/audit-log
 * Lists the most recent administrative/destructive actions taken in this
 * business (deletes, team changes) - for the Settings > Activity Log page.
 */
const getAll = asyncHandler(async (req, res) => {
  const entries = await listAuditLog(req.params.businessId);

  return sendSuccess(res, {
    message: "Activity log fetched successfully",
    data: entries,
  });
});

module.exports = { getAll };
