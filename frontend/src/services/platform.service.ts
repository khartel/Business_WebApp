// Platform/god-mode admin endpoints for managing SuperAdmin accounts across
// the whole system. Deliberately separate from the normal `apiClient`: these
// calls are NOT authenticated via the session cookie — instead each request
// carries a shared `x-master-key` header (passed in explicitly by the
// caller), since the person using this client is outside the normal
// per-business role system entirely.
import axios, { type AxiosError } from "axios"
import { ApiError, type ApiFailure, type ApiSuccess } from "@/lib/api-client"
import type { AuditLogEntry } from "@/services/auditLog.service"

// Separate axios instance (no `withCredentials`) since auth here is via the
// master key header, not the session cookie.
const platformClient = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// Same error-normalization behavior as the main `apiClient` interceptor.
platformClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiFailure>) => {
    const statusCode = error.response?.status ?? 0
    const message = error.response?.data?.message ?? error.message ?? "Something went wrong"
    return Promise.reject(new ApiError(message, statusCode))
  }
)

// Unwraps the { success, message, data } envelope, mirroring `apiRequest`.
async function platformRequest<T>(promise: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}

// A business owned by a given SuperAdmin, with aggregate counts.
export interface SuperAdminBusiness {
  id: string
  name: string
  country: string
  currency: string
  createdAt: string
  _count: { transactions: number; products: number; warehouses: number; businessUsers: number }
}

// A SuperAdmin account and the businesses they own.
export interface SuperAdminSummary {
  id: string
  fullName: string
  username: string
  email: string | null
  phone: string
  createdAt: string
  ownedBusinesses: SuperAdminBusiness[]
}

/** Lists every SuperAdmin account in the system. Requires the platform master key. */
export const getSuperAdmins = (masterKey: string) =>
  platformRequest<SuperAdminSummary[]>(
    platformClient.get("/platform/superadmins", { headers: { "x-master-key": masterKey } })
  )

/** Deletes a SuperAdmin account (and, presumably, cascades to their businesses server-side). */
export const deleteSuperAdmin = (masterKey: string, userId: string) =>
  platformRequest<null>(
    platformClient.delete(`/platform/superadmins/${userId}`, { headers: { "x-master-key": masterKey } })
  )

/** Force-resets a SuperAdmin's password, returning the newly generated one. */
export const resetSuperAdminPassword = (masterKey: string, userId: string) =>
  platformRequest<{ username: string; newPassword: string }>(
    platformClient.post(
      `/platform/superadmins/${userId}/reset-password`,
      {},
      { headers: { "x-master-key": masterKey } }
    )
  )

/**
 * Lists platform-level audit events (a business being deleted, SuperAdmin
 * accounts being registered/removed) — the ones no per-business Activity
 * Log page can ever show, since the business is gone by the time you'd
 * look, or there was no business involved at all.
 */
export const getPlatformActivity = (masterKey: string) =>
  platformRequest<AuditLogEntry[]>(
    platformClient.get("/platform/activity", { headers: { "x-master-key": masterKey } })
  )
