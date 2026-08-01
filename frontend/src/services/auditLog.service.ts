// Wrapper around the /businesses/:businessId/audit-log endpoint — the
// administrative/destructive-action trail shown on Settings > Activity Log
// (deletes of products/customers/warehouses, team membership changes,
// business creation). Not routine sales/stock activity, which already has
// its own history views (Transactions, Stock Movements).
import { apiClient, apiRequest } from "@/lib/api-client"

export interface AuditLogEntry {
  id: string
  businessId: string | null
  actorId: string | null
  actorName: string | null
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

/** Lists the most recent audit-log entries for a business, newest first. */
export const getAuditLog = (businessId: string) =>
  apiRequest<AuditLogEntry[]>(apiClient.get(`/businesses/${businessId}/audit-log`))
