// Wrappers around the /businesses/:businessId/customers endpoints —
// customer directory and their transaction/credit history.
import { apiClient, apiRequest } from "@/lib/api-client"

// A customer record, with aggregate stats (`outstandingCredit` is the total
// unpaid balance across CREDIT transactions) computed server-side.
export interface Customer {
  id: string
  businessId: string
  name: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
  transactionCount: number
  totalSpent: number
  outstandingCredit: number
}

// One line item within a customer's past transaction.
export interface CustomerTransactionItem {
  id: string
  quantitySold: number
  unitPrice: number
  subtotal: number
  discountPercent: number | null
  product: { id: string; name: string; unit: string }
}

// A past transaction made by this customer. `balanceDue` is what's still
// owed for CREDIT sales (0 once fully paid); `paidAt` is set once the
// outstanding balance is cleared.
export interface CustomerTransaction {
  id: string
  paymentMethod: "CASH" | "TRANSFER" | "CREDIT"
  totalAmount: number
  customerName: string
  notes: string | null
  paidAt: string | null
  createdAt: string
  amountPaid: number
  balanceDue: number
  items: CustomerTransactionItem[]
  performedBy: { id: string; fullName: string; username: string }
  warehouse: { id: string; name: string; isPrimary: boolean }
}

// Full customer profile including their transaction history.
export interface CustomerDetail extends Customer {
  transactions: CustomerTransaction[]
}

// Fields required to add a new customer.
export interface CreateCustomerInput {
  name: string
  phone: string
  address: string
}

// Partial customer fields for edits.
export type UpdateCustomerInput = Partial<CreateCustomerInput>

// Optional filters for listing customers: `search` matches name/phone,
// `limit` caps the number of results returned.
export interface ListCustomersParams {
  search?: string
  limit?: number
}

/** Lists customers for a business, optionally filtered by search text and capped by limit. */
export const getCustomers = (businessId: string, params: ListCustomersParams = {}) =>
  apiRequest<Customer[]>(apiClient.get(`/businesses/${businessId}/customers`, { params }))

/** Fetches one customer's profile plus their full transaction history. */
export const getCustomerById = (businessId: string, customerId: string) =>
  apiRequest<CustomerDetail>(apiClient.get(`/businesses/${businessId}/customers/${customerId}`))

/** Creates a new customer for a business. */
export const createCustomer = (businessId: string, input: CreateCustomerInput) =>
  apiRequest<Customer>(apiClient.post(`/businesses/${businessId}/customers`, input))

/** Updates a customer's editable fields. */
export const updateCustomer = (businessId: string, customerId: string, input: UpdateCustomerInput) =>
  apiRequest<Customer>(apiClient.patch(`/businesses/${businessId}/customers/${customerId}`, input))

/** Deletes a customer. */
export const deleteCustomer = (businessId: string, customerId: string) =>
  apiRequest<null>(apiClient.delete(`/businesses/${businessId}/customers/${customerId}`))

// A soft-deleted customer as returned by the Trash endpoint — scalar fields
// only, no transaction history/stats (those aren't loaded for a hidden customer).
export interface DeletedCustomer {
  id: string
  name: string
  phone: string
  deletedAt: string
}

/** Lists soft-deleted customers for a business (the Trash view). */
export const getDeletedCustomers = (businessId: string) =>
  apiRequest<DeletedCustomer[]>(apiClient.get(`/businesses/${businessId}/customers/deleted`))

/** Restores a soft-deleted customer back into the directory. */
export const restoreCustomer = (businessId: string, customerId: string) =>
  apiRequest<null>(apiClient.post(`/businesses/${businessId}/customers/${customerId}/restore`))

/** Merges a duplicate customer (`customerId`) into another (`intoCustomerId`), moving its transactions over. */
export const mergeCustomer = (businessId: string, customerId: string, intoCustomerId: string) =>
  apiRequest<Customer>(
    apiClient.post(`/businesses/${businessId}/customers/${customerId}/merge`, { intoCustomerId })
  )
