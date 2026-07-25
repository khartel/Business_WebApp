import { useQuery } from "@tanstack/react-query"
import { ArrowLeftRight } from "lucide-react"
import * as stockService from "@/services/stock.service"
import { useAuth } from "@/context/AuthContext"
import { canManage } from "@/lib/permissions"
import { formatDateTime } from "@/lib/format"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { MoveStockDialog } from "@/components/stock/MoveStockDialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function StockMovements() {
  const { user, activeBusinessId } = useAuth()
  const canEdit = canManage(user?.role)

  const movementsQuery = useQuery({
    queryKey: ["stock-movements", activeBusinessId],
    queryFn: () => stockService.getStockMovements(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  if (!activeBusinessId) {
    return (
      <EmptyState
        icon={<ArrowLeftRight className="size-6" />}
        title="No business selected"
        description="Select or create a business to view stock movements."
      />
    )
  }

  const movements = movementsQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movements"
        description="Transfers of product stock between warehouses."
        action={canEdit && <MoveStockDialog />}
      />

      {movementsQuery.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : movementsQuery.isError ? (
        <ErrorState onRetry={() => movementsQuery.refetch()} />
      ) : movements.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="size-6" />}
          title="No stock movements yet"
          description="Transfers between warehouses will show up here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Moved by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="text-muted-foreground">{formatDateTime(movement.createdAt)}</TableCell>
                  <TableCell className="font-medium">{movement.product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{movement.fromWarehouse.name}</TableCell>
                  <TableCell className="text-muted-foreground">{movement.toWarehouse.name}</TableCell>
                  <TableCell>
                    {movement.quantity} {movement.product.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{movement.movedBy.fullName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
