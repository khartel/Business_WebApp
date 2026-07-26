import { apiClient, apiRequest } from "@/lib/api-client"

export interface Customer {
  id: string
  businessId: string
  name: string
  phone: string | null
  createdAt: string
  updatedAt: string
  transactionCount: number
  totalSpent: number
  outstandingCredit: number
}

export interface CustomerTransactionItem {
  id: string
  quantitySold: number
  unitPrice: number
  subtotal: number
  discountPercent: number | null
  product: { id: string; name: string; unit: string }
}

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

export interface CustomerDetail extends Customer {
  transactions: CustomerTransaction[]
}

export interface CreateCustomerInput {
  name: string
  phone?: string
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>

export interface ListCustomersParams {
  search?: string
  limit?: number
}

export const getCustomers = (businessId: string, params: ListCustomersParams = {}) =>
  apiRequest<Customer[]>(apiClient.get(`/businesses/${businessId}/customers`, { params }))

export const getCustomerById = (businessId: string, customerId: string) =>
  apiRequest<CustomerDetail>(apiClient.get(`/businesses/${businessId}/customers/${customerId}`))

export const createCustomer = (businessId: string, input: CreateCustomerInput) =>
  apiRequest<Customer>(apiClient.post(`/businesses/${businessId}/customers`, input))

export const updateCustomer = (businessId: string, customerId: string, input: UpdateCustomerInput) =>
  apiRequest<Customer>(apiClient.patch(`/businesses/${businessId}/customers/${customerId}`, input))

export const deleteCustomer = (businessId: string, customerId: string) =>
  apiRequest<null>(apiClient.delete(`/businesses/${businessId}/customers/${customerId}`))
