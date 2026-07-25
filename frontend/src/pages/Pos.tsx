import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Search, Store } from "lucide-react"
import { toast } from "sonner"
import * as productService from "@/services/product.service"
import * as transactionService from "@/services/transaction.service"
import type { PaymentMethod } from "@/services/transaction.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { ApiError } from "@/lib/api-client"
import { formatDateTime, formatMoney } from "@/lib/format"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { ProductTile } from "@/components/pos/ProductTile"
import { CartTicket, type CartLine } from "@/components/pos/CartTicket"
import { TransactionDetailSheet } from "@/components/transactions/TransactionDetailSheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [customerName, setCustomerName] = useState("")

  const productsQuery = useQuery({
    queryKey: ["products", businessId],
    queryFn: () => productService.getProducts(businessId),
  })

  const products = productsQuery.data ?? []
  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase())),
    [products, search]
  )

  const cartQuantities = useMemo(
    () => Object.fromEntries(cart.map((line) => [line.productId, line.quantity])),
    [cart]
  )

  const resetTicket = () => {
    setCart([])
    setPaymentMethod("CASH")
    setCustomerName("")
  }

  const addToCart = (product: productService.Product) => {
    const availableStock = product.primaryStock?.quantity ?? 0
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id)
      const nextQty = (existing?.quantity ?? 0) + 1
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
          quantity: 1,
          unitPrice: product.price,
          availableStock,
        },
      ]
    })
  }

  const saleMutation = useMutation({
    mutationFn: () =>
      transactionService.createTransaction(businessId, {
        paymentMethod,
        customerName: customerName || undefined,
        items: cart.map((line) => ({
          productId: line.productId,
          quantitySold: line.quantity,
          unitPrice: line.unitPrice,
        })),
      }),
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", businessId] })
      queryClient.invalidateQueries({ queryKey: ["products", businessId] })
      queryClient.invalidateQueries({ queryKey: ["business", businessId] })
      toast.success(`Sale recorded — ${formatMoney(transaction.totalAmount, currency)}`)
      resetTicket()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not record sale")
    },
  })

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl pl-9"
          />
        </div>

        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Store className="size-6" />}
            title={products.length === 0 ? "No products yet" : "No matches"}
            description={
              products.length === 0
                ? "Add products from the Products page to start selling."
                : "Try a different search term."
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductTile
                key={product.id}
                product={product}
                currency={currency}
                cartQuantity={cartQuantities[product.id] ?? 0}
                onAdd={() => addToCart(product)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-0 lg:h-[calc(100svh-8.5rem)]">
        <CartTicket
          cart={cart}
          currency={currency}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
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
              prev.map((line) => (line.productId === productId ? { ...line, unitPrice: price } : line))
            )
          }
          onRemove={(productId) => setCart((prev) => prev.filter((line) => line.productId !== productId))}
          onComplete={() => saleMutation.mutate()}
          isSubmitting={saleMutation.isPending}
        />
      </div>
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
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Store className="size-6" />}
          title="No sales yet"
          description="Sales you record will show up here."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl dark:bg-card/40">
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
