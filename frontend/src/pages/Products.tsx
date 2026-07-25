import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Package, Trash2 } from "lucide-react"
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
import { AddStockDialog } from "@/components/products/AddStockDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description={activeBusiness ? `Catalog for ${activeBusiness.name}` : undefined}
        action={canEdit && <ProductFormDialog />}
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
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isLow = product.stock.some((s) => s.quantity <= s.lowStockThreshold)
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="max-w-xs truncate text-xs text-muted-foreground">
                          {product.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{formatMoney(product.price, currency)}</TableCell>
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
                    <TableCell>
                      {canEdit && (
                        <div className="flex justify-end gap-2">
                          <AddStockDialog product={product} />
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
  )
}
