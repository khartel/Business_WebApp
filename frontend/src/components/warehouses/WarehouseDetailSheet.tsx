import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Package, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import * as warehouseService from "@/services/warehouse.service"
import { EmptyState } from "@/components/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
 * Centered dialog showing a single warehouse's stocked products with an in-dialog
 * search box to filter them by name (client-side, case-insensitive substring match).
 *
 * Props:
 * - warehouseId: when null the dialog is closed; setting it triggers the detail fetch
 *   (query is `enabled: !!warehouseId`).
 * - onOpenChange: called when the dialog is dismissed; the local search text is reset
 *   whenever the dialog closes.
 *
 * Each row shows "Out" when quantity is 0, or "Low" when quantity is at/below that
 * entry's `lowStockThreshold`.
 */
export function WarehouseDetailSheet({
  businessId,
  warehouseId,
  onOpenChange,
}: {
  businessId: string
  warehouseId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")

  const query = useQuery({
    queryKey: ["warehouse", businessId, warehouseId],
    queryFn: () => warehouseService.getWarehouseById(businessId, warehouseId!),
    enabled: !!warehouseId,
  })

  const warehouse = query.data
  const stock = warehouse?.stock ?? []
  const filtered = useMemo(
    () => stock.filter((s) => s.product.name.toLowerCase().includes(search.trim().toLowerCase())),
    [stock, search]
  )

  return (
    <Dialog
      open={!!warehouseId}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) setSearch("")
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{warehouse?.name ?? t("Warehouse")}</DialogTitle>
          <DialogDescription>{warehouse?.location || t("No location on file")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {query.isLoading || !warehouse ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("Search products in this warehouse...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  icon={<Package className="size-6" />}
                  title={stock.length === 0 ? "No products here yet" : "No matches"}
                  description={
                    stock.length === 0
                      ? "Add stock to this warehouse to see products here."
                      : "Try a different search term."
                  }
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Product")}</TableHead>
                        <TableHead className="text-right">{t("Quantity")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.product.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {entry.quantity} {entry.product.unit}
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
