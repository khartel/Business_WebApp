// Wrappers around the /businesses/:businessId/products endpoints — the
// product catalog. Stock levels are per-warehouse; see stock.service.ts for
// stock adjustment/transfer operations.
import { apiClient, apiRequest } from "@/lib/api-client"

// A product's stock level in one specific warehouse, plus the threshold at
// which it should be flagged as "low stock".
export interface ProductStockEntry {
  id: string
  quantity: number
  lowStockThreshold: number
  warehouse: { id: string; name: string; isPrimary: boolean; location?: string | null }
}

// A catalog product. `stock` lists per-warehouse quantities; `totalQuantity`
// is the sum across all warehouses and `primaryStock` is the stock entry for
// the business's primary warehouse (both computed server-side for
// convenience).
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

// Fields required to add a new product. `shortCode` is an optional
// quick-search/scan code used in POS lookups.
export interface CreateProductInput {
  name: string
  unit: string
  price?: number
  description?: string
  shortCode?: string
}

// Partial product fields for edits.
export type UpdateProductInput = Partial<CreateProductInput>

/** Lists every product in a business's catalog, with stock info included. */
export const getProducts = (businessId: string) =>
  apiRequest<Product[]>(apiClient.get(`/businesses/${businessId}/products`))

/** Fetches one product by id. */
export const getProductById = (businessId: string, productId: string) =>
  apiRequest<Product>(apiClient.get(`/businesses/${businessId}/products/${productId}`))

/** Creates a new product in the catalog. */
export const createProduct = (businessId: string, input: CreateProductInput) =>
  apiRequest<Product>(apiClient.post(`/businesses/${businessId}/products`, input))

/** Updates a product's editable fields. */
export const updateProduct = (businessId: string, productId: string, input: UpdateProductInput) =>
  apiRequest<Product>(apiClient.patch(`/businesses/${businessId}/products/${productId}`, input))

/** Deletes a product from the catalog. */
export const deleteProduct = (businessId: string, productId: string) =>
  apiRequest<null>(apiClient.delete(`/businesses/${businessId}/products/${productId}`))
