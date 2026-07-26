import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, ChevronLeft, ChevronRight, Printer, Store } from "lucide-react"
import { toast } from "sonner"
import * as productService from "@/services/product.service"
import * as transactionService from "@/services/transaction.service"
import type { PaymentMethod } from "@/services/transaction.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { ApiError } from "@/lib/api-client"
import { formatDateTime, formatMoney } from "@/lib/format"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { PageHeader } from "@/components/PageHeader"
import { ProductSearch } from "@/components/pos/ProductSearch"
import { CartItemsPanel, type CartLine } from "@/components/pos/CartItemsPanel"
import { SaleSummaryPanel } from "@/components/pos/SaleSummaryPanel"
import { TransactionDetailSheet } from "@/components/transactions/TransactionDetailSheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function RegisterTab({ businessId, currency }: { businessId: string; currency: string }) {
  const queryClient = useQueryClient()
  const [cart, setCart] = useState<CartLine[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [customerName, setCustomerName] = useState("")
  const [transferNote, setTransferNote] = useState("")
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [completedSale, setCompletedSale] = useState<{ id: string; total: number } | null>(null)
  const [printTransactionId, setPrintTransactionId] = useState<string | null>(null)

  const productsQuery = useQuery({
    queryKey: ["products", businessId],
    queryFn: () => productService.getProducts(businessId),
  })

  const products = productsQuery.data ?? []

  const resetTicket = () => {
    setCart([])
    setPaymentMethod("CASH")
    setCustomerName("")
    setTransferNote("")
    setSubmitAttempted(false)
  }

  const addToCart = (product: productService.Product, quantity: number) => {
    const availableStock = product.primaryStock?.quantity ?? 0
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id)
      const nextQty = (existing?.quantity ?? 0) + quantity
      if (nextQty > availableStock) {
        toast.error(`Only ${availableStock} ${product.unit} of ${product.name} in stock`)
        return prev
      }
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id ? { ...line, quantity: nextQty } : line
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          quantity,
          catalogPrice: product.price,
          unitPrice: product.price,
          availableStock,
        },
      ]
    })
  }

  const customerNameMissing = paymentMethod === "CREDIT" && !customerName.trim()

  const saleMutation = useMutation({
    mutationFn: () =>
      transactionService.createTransaction(businessId, {
        paymentMethod,
        customerName: customerName || undefined,
        notes: paymentMethod === "TRANSFER" ? transferNote || undefined : undefined,
        items: cart.map((line) => ({
          productId: line.productId,
          quantitySold: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
        })),
      }),
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", businessId] })
      queryClient.invalidateQueries({ queryKey: ["products", businessId] })
      queryClient.invalidateQueries({ queryKey: ["business", businessId] })
      setCompletedSale({ id: transaction.id, total: transaction.totalAmount })
      resetTicket()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not record sale")
    },
  })

  const handleComplete = () => {
    if (customerNameMissing) {
      setSubmitAttempted(true)
      return
    }
    saleMutation.mutate()
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:h-[calc(100svh-8.5rem)] lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4 lg:min-h-0">
        <div className="shrink-0">
          {productsQuery.isLoading ? (
            <Skeleton className="h-14 rounded-2xl" />
          ) : productsQuery.isError ? (
            <ErrorState onRetry={() => productsQuery.refetch()} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Store className="size-6" />}
              title="No products yet"
              description="Add products from the Products page to start selling."
            />
          ) : (
            <ProductSearch products={products} currency={currency} onAdd={addToCart} />
          )}
        </div>

        <div className="flex-1 lg:min-h-0">
          <CartItemsPanel
            cart={cart}
            currency={currency}
            onIncrement={(productId) =>
              setCart((prev) =>
                prev.map((line) => {
                  if (line.productId !== productId) return line
                  if (line.quantity >= line.availableStock) {
                    toast.error(`Only ${line.availableStock} ${line.unit} in stock`)
                    return line
                  }
                  return { ...line, quantity: line.quantity + 1 }
                })
              )
            }
            onDecrement={(productId) =>
              setCart((prev) =>
                prev
                  .map((line) =>
                    line.productId === productId ? { ...line, quantity: line.quantity - 1 } : line
                  )
                  .filter((line) => line.quantity > 0)
              )
            }
            onPriceChange={(productId, price) =>
              setCart((prev) =>
                prev.map((line) => {
                  if (line.productId !== productId) return line
                  const discountPercent =
                    line.catalogPrice > 0 && price < line.catalogPrice
                      ? Math.round((1 - price / line.catalogPrice) * 1000) / 10
                      : undefined
                  return { ...line, unitPrice: price, discountPercent }
                })
              )
            }
            onDiscountChange={(productId, percent) =>
              setCart((prev) =>
                prev.map((line) => {
                  if (line.productId !== productId) return line
                  if (percent === null) {
                    return { ...line, unitPrice: line.catalogPrice, discountPercent: undefined }
                  }
                  return {
                    ...line,
                    discountPercent: percent,
                    unitPrice: Math.round(line.catalogPrice * (1 - percent / 100) * 100) / 100,
                  }
                })
              )
            }
            onRemove={(productId) => setCart((prev) => prev.filter((line) => line.productId !== productId))}
          />
        </div>
      </div>

      <div className="lg:min-h-0">
        <SaleSummaryPanel
          businessId={businessId}
          cart={cart}
          currency={currency}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          customerNameRequired={paymentMethod === "CREDIT"}
          customerNameError={
            submitAttempted && customerNameMissing ? "Customer name is required for credit sales" : undefined
          }
          transferNote={transferNote}
          onTransferNoteChange={setTransferNote}
          onComplete={handleComplete}
          isSubmitting={saleMutation.isPending}
        />
      </div>

      <Dialog open={!!completedSale} onOpenChange={(open) => !open && setCompletedSale(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-success text-primary-foreground shadow-[0_0_24px_var(--glow-primary)]">
            <CheckCircle2 className="size-7" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Sale complete</DialogTitle>
            <DialogDescription className="text-center">
              {completedSale && formatMoney(completedSale.total, currency)} recorded successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-primary to-success text-primary-foreground shadow-[0_0_16px_var(--glow-primary)] hover:opacity-90"
              onClick={() => {
                setPrintTransactionId(completedSale!.id)
                setCompletedSale(null)
              }}
            >
              <Printer className="size-4" />
              Print receipt
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setCompletedSale(null)}>
              New sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TransactionDetailSheet
        businessId={businessId}
        transactionId={printTransactionId}
        onOpenChange={(open) => !open && setPrintTransactionId(null)}
      />
    </div>
  )
}

function HistoryTab({ businessId, currency }: { businessId: string; currency: string }) {
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const transactionsQuery = useQuery({
    queryKey: ["transactions", businessId, page],
    queryFn: () => transactionService.getTransactions(businessId, { page, limit: 20 }),
  })

  const data = transactionsQuery.data
  const transactions = data?.transactions ?? []

  return (
    <div className="space-y-4">
      {transactionsQuery.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : transactionsQuery.isError ? (
        <ErrorState onRetry={() => transactionsQuery.refetch()} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Store className="size-6" />}
          title="No sales yet"
          description="Sales you record will show up here."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl dark:bg-card/40">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Served by</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="cursor-pointer" onClick={() => setSelectedId(tx.id)}>
                    <TableCell className="text-muted-foreground">{formatDateTime(tx.createdAt)}</TableCell>
                    <TableCell className="font-medium">{tx.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.items.length} item{tx.items.length !== 1 && "s"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tx.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.performedBy.fullName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(tx.totalAmount, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} sales
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <TransactionDetailSheet
        businessId={businessId}
        transactionId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  )
}

export default function Pos() {
  const { activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? "USD"

  if (!activeBusinessId) {
    return (
      <EmptyState
        icon={<Store className="size-6" />}
        title="No business selected"
        description="Select or create a business to start recording sales."
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register"
        description={activeBusiness ? activeBusiness.name : undefined}
      />

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="register">
          <RegisterTab businessId={activeBusinessId} currency={currency} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab businessId={activeBusinessId} currency={currency} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
