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

export interface BusinessListItem {
  id: string
  name: string
  phone: string
  email: string | null
  country: string
  location: string
  currency: string
  createdAt: string
  warehouses: Array<{ id: string; name: string; location: string | null }>
  _count: {
    businessUsers: number
    warehouses: number
    products: number
    transactions: number
  }
}

export interface CountryOption {
  country: string
  currency: { code: string; name: string; symbol: string }
}

export interface CreateBusinessInput {
  name: string
  phone: string
  email?: string
  country: string
  location: string
}

export interface UpdateBusinessInput {
  name?: string
  phone?: string
  email?: string
  location?: string
}

export const getBusinessById = (businessId: string) =>
  apiRequest<BusinessDetail>(apiClient.get(`/businesses/${businessId}`))

export const getMyBusinesses = () => apiRequest<BusinessListItem[]>(apiClient.get("/businesses"))

export const getCountries = () => apiRequest<CountryOption[]>(apiClient.get("/businesses/countries"))

export const createBusiness = (input: CreateBusinessInput) =>
  apiRequest<BusinessDetail>(apiClient.post("/businesses", input))

export const updateBusiness = (businessId: string, input: UpdateBusinessInput) =>
  apiRequest<BusinessDetail>(apiClient.patch(`/businesses/${businessId}`, input))

export const deleteBusiness = (businessId: string) =>
  apiRequest<null>(apiClient.delete(`/businesses/${businessId}`))
