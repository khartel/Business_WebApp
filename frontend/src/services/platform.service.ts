import axios, { type AxiosError } from "axios"
import { ApiError, type ApiFailure, type ApiSuccess } from "@/lib/api-client"

const platformClient = axios.create({ baseURL: import.meta.env.VITE_API_URL })

platformClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiFailure>) => {
    const statusCode = error.response?.status ?? 0
    const message = error.response?.data?.message ?? error.message ?? "Something went wrong"
    return Promise.reject(new ApiError(message, statusCode))
  }
)

async function platformRequest<T>(promise: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}

export interface SuperAdminBusiness {
  id: string
  name: string
  country: string
  currency: string
  createdAt: string
  _count: { transactions: number; products: number; warehouses: number; businessUsers: number }
}

export interface SuperAdminSummary {
  id: string
  fullName: string
  username: string
  email: string | null
  phone: string
  createdAt: string
  ownedBusinesses: SuperAdminBusiness[]
}

export const getSuperAdmins = (masterKey: string) =>
  platformRequest<SuperAdminSummary[]>(
    platformClient.get("/platform/superadmins", { headers: { "x-master-key": masterKey } })
  )

export const deleteSuperAdmin = (masterKey: string, userId: string) =>
  platformRequest<null>(
    platformClient.delete(`/platform/superadmins/${userId}`, { headers: { "x-master-key": masterKey } })
  )

export const resetSuperAdminPassword = (masterKey: string, userId: string) =>
  platformRequest<{ username: string; newPassword: string }>(
    platformClient.post(
      `/platform/superadmins/${userId}/reset-password`,
      {},
      { headers: { "x-master-key": masterKey } }
    )
  )
