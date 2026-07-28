import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Package, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import * as productService from "@/services/product.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { canManage } from "@/lib/permissions"
import { ApiError } from "@/lib/api-client"
import { formatMoney } from "@/lib/format"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ProductFormDialog } from "@/components/products/ProductFormDialog"
import { ReceiveStockDialog } from "@/components/products/ReceiveStockDialog"
import { ProductDetailSheet } from "@/components/products/ProductDetailSheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Products() {
  const { user, activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const queryClient = useQueryClient()
  const canEdit = canManage(user?.role)
  const currency = activeBusiness?.currency ?? "USD"
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const productsQuery = useQuery({
    queryKey: ["products", activeBusinessId],
    queryFn: () => productService.getProducts(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => productService.deleteProduct(activeBusinessId!, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", activeBusinessId] })
      queryClient.invalidateQueries({ queryKey: ["business", activeBusinessId] })
      toast.success("Product deleted")
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not delete product"),
  })

  if (!activeBusinessId) {
    return (
      <EmptyState
        icon={<Package className="size-6" />}
        title="No business selected"
        description="Select or create a business to manage products."
      />
    )
  }

  const products = productsQuery.data ?? []
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.shortCode?.toLowerCase().includes(q)
    )
  }, [products, search])

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          canEdit && (
            <div className="flex gap-2">
              <ReceiveStockDialog />
              <ProductFormDialog />
            </div>
          )
        }
      />

      {productsQuery.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : productsQuery.isError ? (
        <ErrorState onRetry={() => productsQuery.refetch()} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" />}
          title="No products yet"
          description="Add your first product to start tracking stock and sales."
        />
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={<Package className="size-6" />}
              title="No matches"
              description="Try a different search term."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const isLow = product.stock.some((s) => s.quantity <= s.lowStockThreshold)
                    return (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedProductId(product.id)}
                      >
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="max-w-xs truncate text-xs text-muted-foreground">
                              {product.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.shortCode ? (
                            <Badge variant="secondary">{product.shortCode}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{product.unit}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatMoney(product.price, currency)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.totalQuantity} {product.unit}
                            {product.totalQuantity === 0 ? (
                              <Badge variant="destructive">Out of stock</Badge>
                            ) : (
                              isLow && <Badge className="bg-chart-4/15 text-chart-4">Low stock</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {canEdit && (
                            <div className="flex justify-end gap-2">
                              <ProductFormDialog product={product} />
                              <ConfirmDialog
                                trigger={
                                  <Button variant="outline" size="icon-sm" aria-label="Delete product">
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                }
                                title="Delete product?"
                                description={`This will permanently delete "${product.name}". Products with sales history can't be deleted.`}
                                confirmLabel="Delete"
                                isLoading={deleteMutation.isPending}
                                onConfirm={() => deleteMutation.mutate(product.id)}
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      <ProductDetailSheet
        businessId={activeBusinessId}
        productId={selectedProductId}
        currency={currency}
        onOpenChange={(open) => !open && setSelectedProductId(null)}
      />
    </div>
  )
}
