import { apiClient, apiRequest } from "@/lib/api-client"

export interface Warehouse {
  id: string
  businessId: string
  name: string
  location: string | null
  isPrimary: boolean
  createdAt: string
  updatedAt: string
  stock?: Array<{
    id: string
    quantity: number
    lowStockThreshold: number
    product: { id: string; name: string; unit: string }
  }>
  _count?: { stock: number; transactions: number }
}

export interface CreateWarehouseInput {
  name: string
  location?: string
  isPrimary?: boolean
}

export interface UpdateWarehouseInput {
  name?: string
  location?: string
}

export const getWarehouses = (businessId: string) =>
  apiRequest<Warehouse[]>(apiClient.get(`/businesses/${businessId}/warehouses`))

export const getWarehouseById = (businessId: string, warehouseId: string) =>
  apiRequest<Warehouse>(apiClient.get(`/businesses/${businessId}/warehouses/${warehouseId}`))

export const createWarehouse = (businessId: string, input: CreateWarehouseInput) =>
  apiRequest<Warehouse>(apiClient.post(`/businesses/${businessId}/warehouses`, input))

export const updateWarehouse = (businessId: string, warehouseId: string, input: UpdateWarehouseInput) =>
  apiRequest<Warehouse>(apiClient.patch(`/businesses/${businessId}/warehouses/${warehouseId}`, input))

export const setPrimaryWarehouse = (businessId: string, warehouseId: string) =>
  apiRequest<Warehouse>(apiClient.patch(`/businesses/${businessId}/warehouses/${warehouseId}/primary`))

export const deleteWarehouse = (businessId: string, warehouseId: string) =>
  apiRequest<null>(apiClient.delete(`/businesses/${businessId}/warehouses/${warehouseId}`))
