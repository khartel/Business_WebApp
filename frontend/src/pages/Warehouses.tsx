import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Star, Trash2, Warehouse as WarehouseIcon } from "lucide-react"
import { toast } from "sonner"
import * as warehouseService from "@/services/warehouse.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { canManage } from "@/lib/permissions"
import { ApiError } from "@/lib/api-client"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { WarehouseFormDialog } from "@/components/warehouses/WarehouseFormDialog"
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

export default function Warehouses() {
  const { user, activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const queryClient = useQueryClient()
  const canEdit = canManage(user?.role)

  const warehousesQuery = useQuery({
    queryKey: ["warehouses", activeBusinessId],
    queryFn: () => warehouseService.getWarehouses(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["warehouses", activeBusinessId] })
    queryClient.invalidateQueries({ queryKey: ["business", activeBusinessId] })
  }

  const setPrimaryMutation = useMutation({
    mutationFn: (warehouseId: string) => warehouseService.setPrimaryWarehouse(activeBusinessId!, warehouseId),
    onSuccess: () => {
      invalidate()
      toast.success("Primary warehouse updated")
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update"),
  })

  const deleteMutation = useMutation({
    mutationFn: (warehouseId: string) => warehouseService.deleteWarehouse(activeBusinessId!, warehouseId),
    onSuccess: () => {
      invalidate()
      toast.success("Warehouse deleted")
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete warehouse"),
  })

  if (!activeBusinessId) {
    return (
      <EmptyState
        icon={<WarehouseIcon className="size-6" />}
        title="No business selected"
        description="Select or create a business to manage warehouses."
      />
    )
  }

  const warehouses = warehousesQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        description={activeBusiness ? `Stock locations for ${activeBusiness.name}` : undefined}
        action={canEdit && <WarehouseFormDialog />}
      />

      {warehousesQuery.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : warehousesQuery.isError ? (
        <ErrorState onRetry={() => warehousesQuery.refetch()} />
      ) : warehouses.length === 0 ? (
        <EmptyState
          icon={<WarehouseIcon className="size-6" />}
          title="No warehouses yet"
          description="Create your first warehouse to start adding stock."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Products in stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {warehouse.name}
                      {warehouse.isPrimary && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="size-3 fill-current" />
                          Primary
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{warehouse.location || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{warehouse._count?.stock ?? 0}</TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex justify-end gap-2">
                        {!warehouse.isPrimary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPrimaryMutation.mutate(warehouse.id)}
                            disabled={setPrimaryMutation.isPending}
                          >
                            Make primary
                          </Button>
                        )}
                        <WarehouseFormDialog warehouse={warehouse} />
                        <ConfirmDialog
                          trigger={
                            <Button variant="outline" size="icon-sm" aria-label="Delete warehouse">
                              <Trash2 className="size-3.5" />
                            </Button>
                          }
                          title="Delete warehouse?"
                          description={`This will permanently delete "${warehouse.name}". This can't be undone.`}
                          confirmLabel="Delete"
                          isLoading={deleteMutation.isPending}
                          onConfirm={() => deleteMutation.mutate(warehouse.id)}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
