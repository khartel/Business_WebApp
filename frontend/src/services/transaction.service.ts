import { apiClient, apiRequest } from "@/lib/api-client"

export type PaymentMethod = "CASH" | "TRANSFER" | "CREDIT"

export interface TransactionItem {
  id: string
  quantitySold: number
  unitPrice: number
  subtotal: number
  discountPercent: number | null
  product: { id: string; name: string; unit: string }
}

export interface CreditPayment {
  id: string
  amount: number
  createdAt: string
  recordedBy: { id: string; fullName: string; username: string }
}

export interface Transaction {
  id: string
  businessId: string
  warehouseId: string
  customerId: string | null
  paymentMethod: PaymentMethod
  totalAmount: number
  customerName: string
  notes: string | null
  paidAt: string | null
  createdAt: string
  items: TransactionItem[]
  payments: CreditPayment[]
  amountPaid: number
  balanceDue: number
  performedBy: { id: string; fullName: string; username: string; role: string }
  warehouse: { id: string; name: string; isPrimary: boolean }
}

export interface CreateTransactionInput {
  paymentMethod: PaymentMethod
  customerName?: string
  notes?: string
  items: Array<{
    productId: string
    quantitySold: number
    unitPrice: number
    discountPercent?: number
  }>
}

export interface ListTransactionsParams {
  performedById?: string
  paymentMethod?: PaymentMethod
  paid?: boolean
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface PaginatedTransactions {
  transactions: Transaction[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

export const getTransactions = (businessId: string, params: ListTransactionsParams = {}) =>
  apiRequest<PaginatedTransactions>(
    apiClient.get(`/businesses/${businessId}/transactions`, { params })
  )

export const getTransactionById = (businessId: string, transactionId: string) =>
  apiRequest<Transaction>(apiClient.get(`/businesses/${businessId}/transactions/${transactionId}`))

export const createTransaction = (businessId: string, input: CreateTransactionInput) =>
  apiRequest<Transaction>(apiClient.post(`/businesses/${businessId}/transactions`, input))

export const recordPayment = (businessId: string, transactionId: string, amount: number) =>
  apiRequest<Transaction>(
    apiClient.post(`/businesses/${businessId}/transactions/${transactionId}/payments`, { amount })
  )
