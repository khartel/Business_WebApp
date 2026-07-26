import { apiClient, apiRequest } from "@/lib/api-client"

export interface ProductStockEntry {
  id: string
  quantity: number
  lowStockThreshold: number
  warehouse: { id: string; name: string; isPrimary: boolean; location?: string | null }
}

export interface Product {
  id: string
  businessId: string
  name: string
  unit: string
  price: number
  description: string | null
  shortCode: string | null
  createdAt: string
  updatedAt: string
  stock: ProductStockEntry[]
  totalQuantity: number
  primaryStock: ProductStockEntry | null
}

export interface CreateProductInput {
  name: string
  unit: string
  price?: number
  description?: string
  shortCode?: string
}

export type UpdateProductInput = Partial<CreateProductInput>

export const getProducts = (businessId: string) =>
  apiRequest<Product[]>(apiClient.get(`/businesses/${businessId}/products`))

export const getProductById = (businessId: string, productId: string) =>
  apiRequest<Product>(apiClient.get(`/businesses/${businessId}/products/${productId}`))

export const createProduct = (businessId: string, input: CreateProductInput) =>
  apiRequest<Product>(apiClient.post(`/businesses/${businessId}/products`, input))

export const updateProduct = (businessId: string, productId: string, input: UpdateProductInput) =>
  apiRequest<Product>(apiClient.patch(`/businesses/${businessId}/products/${productId}`, input))

export const deleteProduct = (businessId: string, productId: string) =>
  apiRequest<null>(apiClient.delete(`/businesses/${businessId}/products/${productId}`))
