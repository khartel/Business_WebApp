import { useQuery } from "@tanstack/react-query"
import { Warehouse as WarehouseIcon } from "lucide-react"
import * as productService from "@/services/product.service"
import { formatMoney } from "@/lib/format"
import { SummaryStat } from "@/components/reports/SummaryStat"
import { EmptyState } from "@/components/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ProductDetailSheet({
  businessId,
  productId,
  currency,
  onOpenChange,
}: {
  businessId: string
  productId: string | null
  currency: string
  onOpenChange: (open: boolean) => void
}) {
  const query = useQuery({
    queryKey: ["product", businessId, productId],
    queryFn: () => productService.getProductById(businessId, productId!),
    enabled: !!productId,
  })

  const product = query.data

  return (
    <Sheet open={!!productId} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {product?.name ?? "Product"}
            {product?.shortCode && <Badge variant="secondary">{product.shortCode}</Badge>}
          </SheetTitle>
          <SheetDescription>{product?.description || "No description"}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          {query.isLoading || !product ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <SummaryStat label="Price" value={formatMoney(product.price, currency)} />
                <SummaryStat label="Total stock" value={`${product.totalQuantity} ${product.unit}`} />
              </div>

              {product.stock.length === 0 ? (
                <EmptyState
                  icon={<WarehouseIcon className="size-6" />}
                  title="Not stocked anywhere yet"
                  description="Add stock to a warehouse to start tracking this product."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Warehouse</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.stock.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="flex items-center gap-1.5 font-medium">
                              {entry.warehouse.name}
                              {entry.warehouse.isPrimary && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Primary
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {entry.quantity} {product.unit}
                              {entry.quantity === 0 ? (
                                <Badge variant="destructive">Out</Badge>
                              ) : (
                                entry.quantity <= entry.lowStockThreshold && (
                                  <Badge className="bg-chart-4/15 text-chart-4">Low</Badge>
                                )
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
