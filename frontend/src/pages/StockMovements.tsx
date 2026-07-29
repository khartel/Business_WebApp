import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeftRight, PackagePlus, X } from "lucide-react"
import * as stockService from "@/services/stock.service"
import type { StockMovement } from "@/services/stock.service"
import * as warehouseService from "@/services/warehouse.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { canManage } from "@/lib/permissions"
import { formatDate } from "@/lib/format"
import { downloadCsv } from "@/lib/csv"
import { downloadPdfReport } from "@/lib/pdf"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { MoveStockDialog } from "@/components/stock/MoveStockDialog"
import { DownloadMenu } from "@/components/reports/DownloadMenu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

// Sentinel value for the "no filter selected" option in the warehouse/type
// Select dropdowns (native <select> can't use an empty-string value cleanly).
const ANY = "__any__"

// Formats an ISO date string as a local time (e.g. "3:45 PM") for the
// per-movement rows inside a day's detail sheet.
function formatTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

// Small colored badge distinguishing a RESTOCK (incoming stock) from a
// TRANSFER (moved between warehouses) movement.
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

// One row in the top-level table: all movements that happened on a given
// calendar day, expandable into a detail sheet.
interface DayGroup {
  key: string
  label: string
  movements: StockMovement[]
}

/**
 * StockMovements page — audit log of stock restocks and inter-warehouse
 * transfers for the active business, grouped by day (each row expands into
 * a detail sheet listing that day's individual movements).
 *
 * Data: `["warehouses", activeBusinessId]` (for the from/to filter
 * dropdowns) and `["stock-movements", activeBusinessId, filters]` via
 * `stockService.getStockMovements`. `filters` (date range, from/to
 * warehouse, movement type) is derived from local state and included in
 * the query key, so changing any filter triggers a refetch.
 *
 * Interactions: filter controls (date range, warehouse, type) with a
 * "Clear filters" shortcut; `MoveStockDialog` for managers to record a new
 * transfer; CSV/PDF export of the currently filtered movements via
 * `DownloadMenu` (`downloadAsCsv/downloadAsPdf`, using `lib/csv.ts` and
 * `lib/pdf.ts`).
 */
export default function StockMovements() {
  const { user, activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const canEdit = canManage(user?.role)
  const [selectedDay, setSelectedDay] = useState<DayGroup | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [fromWarehouseId, setFromWarehouseId] = useState(ANY)
  const [toWarehouseId, setToWarehouseId] = useState(ANY)
  const [type, setType] = useState(ANY)

  const warehousesQuery = useQuery({
    queryKey: ["warehouses", activeBusinessId],
    queryFn: () => warehouseService.getWarehouses(activeBusinessId!),
    enabled: !!activeBusinessId,
  })
  const warehouses = warehousesQuery.data ?? []

  const filters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    fromWarehouseId: fromWarehouseId === ANY ? undefined : fromWarehouseId,
    toWarehouseId: toWarehouseId === ANY ? undefined : toWarehouseId,
    type: type === ANY ? undefined : (type as StockMovement["type"]),
  }
  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined)

  // Resets all filter controls back to "no filter" / empty.
  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setFromWarehouseId(ANY)
    setToWarehouseId(ANY)
    setType(ANY)
  }

  const movementsQuery = useQuery({
    queryKey: ["stock-movements", activeBusinessId, filters],
    queryFn: () => stockService.getStockMovements(activeBusinessId!, filters),
    enabled: !!activeBusinessId,
  })

  const movements = movementsQuery.data ?? []

  // Exports the currently filtered movements as a CSV file.
  const downloadAsCsv = () => {
    downloadCsv(`stock-movements-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Date", "Time", "Type", "Product", "From", "To", "Quantity", "Unit", "Moved by", "Notes"],
      ...movements.map((m) => [
        formatDate(m.createdAt),
        formatTime(m.createdAt),
        m.type,
        m.product.name,
        m.fromWarehouse?.name ?? "External",
        m.toWarehouse.name,
        m.quantity,
        m.product.unit,
        m.movedBy.fullName,
        m.notes ?? "",
      ]),
    ])
  }

  // Exports the currently filtered movements as a branded PDF report.
  const downloadAsPdf = () => {
    downloadPdfReport(`stock-movements-${new Date().toISOString().slice(0, 10)}.pdf`, {
      businessName: activeBusiness?.name ?? "",
      businessLocation: activeBusiness?.location,
      title: "STOCK MOVEMENTS",
      dateLine: hasActiveFilters ? "Filtered" : "All movements",
      sections: [
        {
          head: ["Date", "Time", "Type", "Product", "From", "To", "Qty", "By"],
          body: movements.map((m) => [
            formatDate(m.createdAt),
            formatTime(m.createdAt),
            m.type,
            m.product.name,
            m.fromWarehouse?.name ?? "External",
            m.toWarehouse.name,
            `${m.quantity} ${m.product.unit}`,
            m.movedBy.fullName,
          ]),
        },
      ],
      footerNote: "Generated by D-Inventory",
    })
  }

  // Buckets the flat movements list into one DayGroup per calendar day
  // (used to render the collapsed day-by-day table).
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
      <PageHeader action={canEdit && <MoveStockDialog />} />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-auto"
          aria-label="From date"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-auto"
          aria-label="To date"
        />
        <Select value={fromWarehouseId} onValueChange={setFromWarehouseId}>
          <SelectTrigger className="w-40" aria-label="From warehouse">
            <SelectValue placeholder="From warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any source</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
          <SelectTrigger className="w-40" aria-label="To warehouse">
            <SelectValue placeholder="To warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any destination</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-36" aria-label="Movement type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any type</SelectItem>
            <SelectItem value="RESTOCK">Restock</SelectItem>
            <SelectItem value="TRANSFER">Transfer</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-3.5" />
            Clear filters
          </Button>
        )}
        <DownloadMenu
          className="ml-auto"
          disabled={movements.length === 0}
          groups={[{ items: [{ label: "CSV", onClick: downloadAsCsv }, { label: "PDF", onClick: downloadAsPdf }] }]}
        />
      </div>

      {movementsQuery.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : movementsQuery.isError ? (
        <ErrorState onRetry={() => movementsQuery.refetch()} />
      ) : dayGroups.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="size-6" />}
          title={hasActiveFilters ? "No movements match your filters" : "No stock movements yet"}
          description={
            hasActiveFilters
              ? "Try widening the date range or clearing a filter."
              : "Restocks and transfers between warehouses will show up here."
          }
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
