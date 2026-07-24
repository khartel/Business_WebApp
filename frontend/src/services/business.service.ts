import { apiClient, apiRequest } from "@/lib/api-client"

export interface BusinessDetail {
  id: string
  name: string
  phone: string
  email: string | null
  country: string
  location: string
  currency: string
  createdAt: string
  warehouses: Array<{ id: string; name: string; isPrimary: boolean; location: string | null }>
  businessUsers: Array<{
    id: string
    role: string
    user: { id: string; fullName: string; username: string; role: string }
  }>
  _count: {
    businessUsers: number
    warehouses: number
    products: number
    transactions: number
  }
}

export const getBusinessById = (businessId: string) =>
  apiRequest<BusinessDetail>(apiClient.get(`/businesses/${businessId}`))
