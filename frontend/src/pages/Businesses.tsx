import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Building2, Trash2 } from "lucide-react"
import * as businessService from "@/services/business.service"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/lib/api-client"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/EmptyState"
import { ErrorState } from "@/components/ErrorState"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { BusinessCard } from "@/components/businesses/BusinessCard"
import { CreateBusinessDialog } from "@/components/businesses/CreateBusinessDialog"
import { EditBusinessDialog } from "@/components/businesses/EditBusinessDialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Businesses page — lets a SUPERADMIN (the account owner) view, create, edit,
 * and delete the businesses they own, and switch which one is "active" for
 * the rest of the app.
 *
 * Data: `["businesses"]` query via `businessService.getMyBusinesses` (only
 * enabled for SUPERADMIN users — non-owners never see this list).
 *
 * Access control: non-SUPERADMIN users are shown an `EmptyState` instead of
 * the page content, since only the owner can manage businesses.
 *
 * Interactions:
 * - Selecting a business card sets it as the active business and navigates
 *   to the POS screen.
 * - `CreateBusinessDialog` / `EditBusinessDialog` handle create/edit forms.
 * - Deleting a business runs `deleteMutation`, which invalidates the
 *   businesses list, the current user (`["auth", "me"]`), and removes any
 *   cached `["business", businessId]` data for the deleted business.
 *
 * States: loading (skeleton cards), error (`ErrorState` with retry), empty
 * (no businesses yet), and the populated grid of `BusinessCard`s.
 */
export default function Businesses() {
  const { user, activeBusinessId, setActiveBusinessId } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isSuperAdmin = user?.role === "SUPERADMIN"

  const businessesQuery = useQuery({
    queryKey: ["businesses"],
    queryFn: businessService.getMyBusinesses,
    enabled: isSuperAdmin,
  })

  // Deletes a business and cleans up any React Query caches tied to it.
  const deleteMutation = useMutation({
    mutationFn: (businessId: string) => businessService.deleteBusiness(businessId),
    onSuccess: (_, businessId) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] })
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      queryClient.removeQueries({ queryKey: ["business", businessId] })
      toast.success("Business deleted")
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not delete business"),
  })

  if (!isSuperAdmin) {
    return (
      <EmptyState
        icon={<Building2 className="size-6" />}
        title="Not available"
        description="Only the business owner can manage businesses."
      />
    )
  }

  const businesses = businessesQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader action={<CreateBusinessDialog />} />

      {businessesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
      ) : businessesQuery.isError ? (
        <ErrorState onRetry={() => businessesQuery.refetch()} />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="No businesses yet"
          description="Create your first business to start tracking inventory and sales."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              name={business.name}
              location={business.location}
              country={business.country}
              currency={business.currency}
              isActive={business.id === activeBusinessId}
              onSelect={() => {
                setActiveBusinessId(business.id)
                navigate("/pos")
              }}
              stats={{
                products: business._count.products,
                warehouses: business._count.warehouses,
                team: business._count.businessUsers,
                sales: business._count.transactions,
              }}
              actions={
                <div className="flex gap-2">
                  <EditBusinessDialog business={business} />
                  <ConfirmDialog
                    trigger={
                      <Button variant="outline" size="icon-sm" aria-label="Delete business">
                        <Trash2 className="size-3.5" />
                      </Button>
                    }
                    title="Delete business?"
                    description={`This permanently deletes "${business.name}" and everything under it — products, warehouses, stock, sales, and team access. This can't be undone.`}
                    confirmLabel="Delete"
                    isLoading={deleteMutation.isPending}
                    onConfirm={() => deleteMutation.mutate(business.id)}
                  />
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
