import { useQuery } from "@tanstack/react-query"
import { Warehouse as WarehouseIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import * as productService from "@/services/product.service"
import { formatMoney } from "@/lib/format"
import { SummaryStat } from "@/components/reports/SummaryStat"
import { EmptyState } from "@/components/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Centered dialog showing a single product's details: price, total stock across
 * warehouses, and a per-warehouse breakdown with low/out-of-stock badges.
 *
 * Props:
 * - productId: when null the dialog is closed; setting it triggers the detail fetch
 *   (query is `enabled: !!productId`).
 * - currency: used to format the price stat.
 * - onOpenChange: called when the dialog is dismissed.
 *
 * Each warehouse row is flagged "Out" when quantity is 0, or "Low" when quantity is
 * at/below that warehouse entry's `lowStockThreshold`.
 */
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
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ["product", businessId, productId],
    queryFn: () => productService.getProductById(businessId, productId!),
    enabled: !!productId,
  })

  const product = query.data

  return (
    <Dialog open={!!productId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product?.name ?? t("Product")}
            {product?.shortCode && <Badge variant="secondary">{product.shortCode}</Badge>}
          </DialogTitle>
          <DialogDescription>{product?.description || t("No description")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {query.isLoading || !product ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <SummaryStat label={t("Price")} value={formatMoney(product.price, currency)} />
                <SummaryStat label={t("Total stock")} value={`${product.totalQuantity} ${product.unit}`} />
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
                        <TableHead>{t("Warehouse")}</TableHead>
                        <TableHead className="text-right">{t("Quantity")}</TableHead>
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
                                  {t("Primary")}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {entry.quantity} {product.unit}
                              {entry.quantity === 0 ? (
                                <Badge variant="destructive">{t("Out")}</Badge>
                              ) : (
                                entry.quantity <= entry.lowStockThreshold && (
                                  <Badge className="bg-chart-4/15 text-chart-4">{t("Low")}</Badge>
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
      </DialogContent>
    </Dialog>
  )
}
