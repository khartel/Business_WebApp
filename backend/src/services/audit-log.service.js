const prisma = require("../utils/prisma");

/**
 * Lists the most recent administrative/destructive-action audit entries for
 * a business (deletes, team membership changes, business creation) - not
 * routine sales/stock activity, which already has its own history views.
 * Newest first.
 *
 * @param {string} businessId
 * @param {{limit?: number}} [options]
 * @returns {Promise<object[]>}
 */
const listAuditLog = async (businessId, { limit = 100 } = {}) => {
  return prisma.auditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

/**
 * Lists platform-level audit events — the ones a per-business Activity Log
 * page can never show, because they either happen before any business
 * exists (a SuperAdmin registering) or outlive the business entirely (its
 * deletion). Scoped to a fixed action allowlist rather than "businessId is
 * null", since that would also catch entries where the business was simply
 * deleted later for unrelated reasons - this list is exactly what
 * `ROADMAP.md` asked for: `business.deleted` and SuperAdmin add/remove.
 *
 * @param {{limit?: number}} [options]
 * @returns {Promise<object[]>}
 */
const listPlatformAuditLog = async ({ limit = 200 } = {}) => {
  return prisma.auditLog.findMany({
    where: { action: { in: ["business.deleted", "superadmin.registered", "superadmin.removed"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

module.exports = { listAuditLog, listPlatformAuditLog };
