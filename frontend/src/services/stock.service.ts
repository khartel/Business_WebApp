import { apiClient, apiRequest } from "@/lib/api-client"

export interface StockMovement {
  id: string
  quantity: number
  status: "PENDING" | "COMPLETED" | "CANCELLED"
  notes: string | null
  createdAt: string
  fromWarehouse: { id: string; name: string }
  toWarehouse: { id: string; name: string }
  product: { id: string; name: string; unit: string }
  movedBy: { id: string; fullName: string; username: string }
}

export interface MoveStockInput {
  fromWarehouseId: string
  toWarehouseId: string
  productId: string
  quantity: number
  notes?: string
}

export const getStockMovements = (businessId: string) =>
  apiRequest<StockMovement[]>(apiClient.get(`/businesses/${businessId}/stock/movements`))

export const moveStock = (businessId: string, input: MoveStockInput) =>
  apiRequest<StockMovement>(apiClient.post(`/businesses/${businessId}/stock/move`, input))
