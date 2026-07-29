// Wrappers around the /businesses/:businessId/warehouses endpoints —
// physical/logical storage locations a business sells and stocks from.
import { apiClient, apiRequest } from "@/lib/api-client"

// A warehouse/store location. Every business has exactly one warehouse
// flagged `isPrimary` (the default location for sales/restocks unless
// otherwise specified). `stock`/`_count` are only populated on detail views.
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
    product: { id: string; name: string; unit: string; description?: string | null }
  }>
  _count?: { stock: number; transactions: number }
}

// Fields for creating a new warehouse. `isPrimary: true` demotes any
// previous primary warehouse (server-side behavior).
export interface CreateWarehouseInput {
  name: string
  location?: string
  isPrimary?: boolean
}

// Editable warehouse fields (primary status is changed separately via `setPrimaryWarehouse`).
export interface UpdateWarehouseInput {
  name?: string
  location?: string
}

/** Lists all warehouses for a business. */
export const getWarehouses = (businessId: string) =>
  apiRequest<Warehouse[]>(apiClient.get(`/businesses/${businessId}/warehouses`))

/** Fetches one warehouse, including its current stock levels. */
export const getWarehouseById = (businessId: string, warehouseId: string) =>
  apiRequest<Warehouse>(apiClient.get(`/businesses/${businessId}/warehouses/${warehouseId}`))

/** Creates a new warehouse for a business. */
export const createWarehouse = (businessId: string, input: CreateWarehouseInput) =>
  apiRequest<Warehouse>(apiClient.post(`/businesses/${businessId}/warehouses`, input))

/** Updates a warehouse's editable fields. */
export const updateWarehouse = (businessId: string, warehouseId: string, input: UpdateWarehouseInput) =>
  apiRequest<Warehouse>(apiClient.patch(`/businesses/${businessId}/warehouses/${warehouseId}`, input))

/** Marks this warehouse as the business's primary location (demoting the previous one). */
export const setPrimaryWarehouse = (businessId: string, warehouseId: string) =>
  apiRequest<Warehouse>(apiClient.patch(`/businesses/${businessId}/warehouses/${warehouseId}/primary`))

/** Deletes a warehouse. */
export const deleteWarehouse = (businessId: string, warehouseId: string) =>
  apiRequest<null>(apiClient.delete(`/businesses/${businessId}/warehouses/${warehouseId}`))
