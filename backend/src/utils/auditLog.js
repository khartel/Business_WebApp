/**
 * Records one entry in the administrative/destructive-action audit trail
 * (deletes of soft-deletable records, team membership changes, business
 * lifecycle) - not routine sales/stock activity, which already has its own
 * history views (Transactions, Stock Movements).
 *
 * `client` is whatever Prisma client is already in scope at the call site
 * (the plain `prisma` singleton, or a `tx` inside a `$transaction`) so the
 * audit write commits or fails atomically with the action it describes.
 */
const recordAudit = (client, { businessId = null, actorId = null, actorName = null, action, entityType, entityId = null, metadata = null }) =>
  client.auditLog.create({
    data: { businessId, actorId, actorName, action, entityType, entityId, metadata },
  });

module.exports = { recordAudit };
