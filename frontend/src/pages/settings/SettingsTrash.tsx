import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { ArchiveRestore, Contact, Package, RotateCcw, Warehouse as WarehouseIcon } from "lucide-react"
import * as productService from "@/services/product.service"
import * as customerService from "@/services/customer.service"
import * as warehouseService from "@/services/warehouse.service"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/lib/api-client"
import { formatDateTime } from "@/lib/format"
import { SettingsSectionHeader } from "@/pages/settings/SettingsSectionHeader"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** Trash tab for soft-deleted products — restore brings one back into the active catalog. */
function ProductsTrash({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["products-deleted", businessId],
    queryFn: () => productService.getDeletedProducts(businessId),
  })

  const restoreMutation = useMutation({
    mutationFn: (productId: string) => productService.restoreProduct(businessId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-deleted", businessId] })
      queryClient.invalidateQueries({ queryKey: ["products", businessId] })
      toast.success(t("Product restored"))
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : t("Could not restore product")),
  })

  const items = query.data ?? []

  if (query.isLoading) return <Skeleton className="h-48 rounded-xl" />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-6" />}
        title="Nothing in the trash"
        description="Deleted products show up here and can be restored at any time."
      />
    )
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {items.map((product) => (
        <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("Deleted {{date}}", { date: formatDateTime(product.deletedAt) })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={restoreMutation.isPending && restoreMutation.variables === product.id}
            onClick={() => restoreMutation.mutate(product.id)}
          >
            <RotateCcw className="size-3.5" />
            {t("Restore")}
          </Button>
        </li>
      ))}
    </ul>
  )
}

/** Trash tab for soft-deleted customers — restore brings one back into the directory. */
function CustomersTrash({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["customers-deleted", businessId],
    queryFn: () => customerService.getDeletedCustomers(businessId),
  })

  const restoreMutation = useMutation({
    mutationFn: (customerId: string) => customerService.restoreCustomer(businessId, customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers-deleted", businessId] })
      queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
      toast.success(t("Customer restored"))
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : t("Could not restore customer")),
  })

  const items = query.data ?? []

  if (query.isLoading) return <Skeleton className="h-48 rounded-xl" />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Contact className="size-6" />}
        title="Nothing in the trash"
        description="Deleted customers show up here and can be restored at any time."
      />
    )
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {items.map((customer) => (
        <li key={customer.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{customer.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("Deleted {{date}}", { date: formatDateTime(customer.deletedAt) })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={restoreMutation.isPending && restoreMutation.variables === customer.id}
            onClick={() => restoreMutation.mutate(customer.id)}
          >
            <RotateCcw className="size-3.5" />
            {t("Restore")}
          </Button>
        </li>
      ))}
    </ul>
  )
}

/** Trash tab for soft-deleted warehouses — restore brings one back into the active list. */
function WarehousesTrash({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["warehouses-deleted", businessId],
    queryFn: () => warehouseService.getDeletedWarehouses(businessId),
  })

  const restoreMutation = useMutation({
    mutationFn: (warehouseId: string) => warehouseService.restoreWarehouse(businessId, warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses-deleted", businessId] })
      queryClient.invalidateQueries({ queryKey: ["warehouses", businessId] })
      toast.success(t("Warehouse restored"))
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : t("Could not restore warehouse")),
  })

  const items = query.data ?? []

  if (query.isLoading) return <Skeleton className="h-48 rounded-xl" />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<WarehouseIcon className="size-6" />}
        title="Nothing in the trash"
        description="Deleted warehouses show up here and can be restored at any time."
      />
    )
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {items.map((warehouse) => (
        <li key={warehouse.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{warehouse.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("Deleted {{date}}", { date: formatDateTime(warehouse.deletedAt) })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={restoreMutation.isPending && restoreMutation.variables === warehouse.id}
            onClick={() => restoreMutation.mutate(warehouse.id)}
          >
            <RotateCcw className="size-3.5" />
            {t("Restore")}
          </Button>
        </li>
      ))}
    </ul>
  )
}

/**
 * Settings > Trash — lets a SuperAdmin/Admin see and restore soft-deleted
 * Products, Customers, and Warehouses. Deleting one of these never actually
 * destroys the row (see `deletedAt` in `schema.prisma`); this page is the
 * previously-missing UI for the "get it back" half of that — before this,
 * a restore was only possible by asking a developer to clear `deletedAt`
 * directly in the database.
 */
export default function SettingsTrash() {
  const { t } = useTranslation()
  const { activeBusinessId } = useAuth()

  if (!activeBusinessId) {
    return (
      <div className="mx-auto max-w-3xl">
        <SettingsSectionHeader title="Trash" description="Restore recently deleted records." />
        <EmptyState
          icon={<ArchiveRestore className="size-6" />}
          title="No business selected"
          description="Select a business to view its trash."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <SettingsSectionHeader
        title="Trash"
        description="Products, customers, and warehouses you've deleted stay here until restored."
      />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">{t("Products")}</TabsTrigger>
          <TabsTrigger value="customers">{t("Customers")}</TabsTrigger>
          <TabsTrigger value="warehouses">{t("Warehouses")}</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <ProductsTrash businessId={activeBusinessId} />
        </TabsContent>
        <TabsContent value="customers">
          <CustomersTrash businessId={activeBusinessId} />
        </TabsContent>
        <TabsContent value="warehouses">
          <WarehousesTrash businessId={activeBusinessId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
