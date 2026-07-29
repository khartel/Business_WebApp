// Wrappers around the /businesses/:businessId/transactions endpoints — the
// POS sales record: creating sales, listing/filtering history, and
// recording installment payments against CREDIT sales.
import { apiClient, apiRequest } from "@/lib/api-client"

// CASH/TRANSFER settle immediately in full; CREDIT is sold now and paid
// later (possibly in installments via `recordPayment`).
export type PaymentMethod = "CASH" | "TRANSFER" | "CREDIT"

// One line item (product + quantity + price) within a transaction.
export interface TransactionItem {
  id: string
  quantitySold: number
  unitPrice: number
  subtotal: number
  discountPercent: number | null
  product: { id: string; name: string; unit: string }
}

// A single installment payment recorded against a CREDIT transaction.
export interface CreditPayment {
  id: string
  amount: number
  createdAt: string
  recordedBy: { id: string; fullName: string; username: string }
}

// A completed sale. `amountPaid`/`balanceDue` track partial payments for
// CREDIT sales (both equal `totalAmount`/0 for CASH/TRANSFER); `paidAt` is
// set once `balanceDue` reaches zero.
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

// Payload for ringing up a new sale (POS checkout). Sold against the
// current user's active warehouse/business context on the backend.
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

// Optional filters/pagination for listing transaction history.
export interface ListTransactionsParams {
  performedById?: string
  paymentMethod?: PaymentMethod
  paid?: boolean
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

// A page of transaction results with pagination metadata.
export interface PaginatedTransactions {
  transactions: Transaction[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

/** Lists transactions for a business, paginated and optionally filtered. */
export const getTransactions = (businessId: string, params: ListTransactionsParams = {}) =>
  apiRequest<PaginatedTransactions>(
    apiClient.get(`/businesses/${businessId}/transactions`, { params })
  )

/** Fetches a single transaction with its full item and payment history. */
export const getTransactionById = (businessId: string, transactionId: string) =>
  apiRequest<Transaction>(apiClient.get(`/businesses/${businessId}/transactions/${transactionId}`))

/** Records a new sale (POS checkout), deducting stock and creating the transaction. */
export const createTransaction = (businessId: string, input: CreateTransactionInput) =>
  apiRequest<Transaction>(apiClient.post(`/businesses/${businessId}/transactions`, input))

/** Records an installment payment against an outstanding CREDIT transaction. */
export const recordPayment = (businessId: string, transactionId: string, amount: number) =>
  apiRequest<Transaction>(
    apiClient.post(`/businesses/${businessId}/transactions/${transactionId}/payments`, { amount })
  )
