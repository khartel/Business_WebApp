import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeftRight, PackagePlus } from "lucide-react"
import * as stockService from "@/services/stock.service"
import type { StockMovement } from "@/services/stock.service"
import { useAuth } from "@/context/AuthContext"
import { canManage } from "@/lib/permissions"
import { formatDate } from "@/lib/format"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { MoveStockDialog } from "@/components/stock/MoveStockDialog"
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

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function MovementTypeBadge({ type }: { type: StockMovement["type"] }) {
  return type === "RESTOCK" ? (
    <Badge className="gap-1 bg-success/15 text-success">
      <PackagePlus className="size-3" />
      Restock
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <ArrowLeftRight className="size-3" />
      Transfer
    </Badge>
  )
}

interface DayGroup {
  key: string
  label: string
  movements: StockMovement[]
}

export default function StockMovements() {
  const { user, activeBusinessId } = useAuth()
  const canEdit = canManage(user?.role)
  const [selectedDay, setSelectedDay] = useState<DayGroup | null>(null)

  const movementsQuery = useQuery({
    queryKey: ["stock-movements", activeBusinessId],
    queryFn: () => stockService.getStockMovements(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  const movements = movementsQuery.data ?? []

  const dayGroups = useMemo(() => {
    const groups = new Map<string, DayGroup>()
    for (const movement of movements) {
      const key = new Date(movement.createdAt).toDateString()
      const existing = groups.get(key)
      if (existing) {
        existing.movements.push(movement)
      } else {
        groups.set(key, { key, label: formatDate(movement.createdAt), movements: [movement] })
      }
    }
    return Array.from(groups.values())
  }, [movements])

  if (!activeBusinessId) {
    return (
      <EmptyState
        icon={<ArrowLeftRight className="size-6" />}
        title="No business selected"
        description="Select or create a business to view stock movements."
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movements"
        description="Restocks and transfers between warehouses, by day."
        action={canEdit && <MoveStockDialog />}
      />

      {movementsQuery.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : movementsQuery.isError ? (
        <ErrorState onRetry={() => movementsQuery.refetch()} />
      ) : dayGroups.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="size-6" />}
          title="No stock movements yet"
          description="Restocks and transfers between warehouses will show up here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Movements</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dayGroups.map((group) => (
                <TableRow key={group.key} className="cursor-pointer" onClick={() => setSelectedDay(group)}>
                  <TableCell className="font-medium">{group.label}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {group.movements.length} movement{group.movements.length !== 1 && "s"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <SheetContent className="data-[side=right]:sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{selectedDay?.label}</SheetTitle>
            <SheetDescription>
              {selectedDay?.movements.length} movement{selectedDay?.movements.length !== 1 && "s"} that day
            </SheetDescription>
          </SheetHeader>

          <div className="mx-4 mb-4 w-auto overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDay?.movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-muted-foreground">{formatTime(movement.createdAt)}</TableCell>
                    <TableCell>
                      <MovementTypeBadge type={movement.type} />
                    </TableCell>
                    <TableCell className="font-medium">{movement.product.name}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {movement.fromWarehouse?.name ?? "External"} → {movement.toWarehouse.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {movement.quantity} {movement.product.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{movement.movedBy.fullName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
