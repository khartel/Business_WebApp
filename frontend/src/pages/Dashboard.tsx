import { useQuery } from "@tanstack/react-query"
import { Package, Warehouse, Users, Receipt } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getBusinessById } from "@/services/business.service"
import { StatCard } from "@/components/dashboard/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/EmptyState"

export default function Dashboard() {
  const { user, activeBusinessId } = useAuth()

  const businessQuery = useQuery({
    queryKey: ["business", activeBusinessId],
    queryFn: () => getBusinessById(activeBusinessId!),
    enabled: !!activeBusinessId,
  })

  if (!activeBusinessId) {
    return (
      <EmptyState
        title="No business selected"
        description={
          user?.role === "SUPERADMIN"
            ? "Create your first business to get started."
            : "You haven't been added to a business yet. Ask your admin to add you."
        }
      />
    )
  }

  const business = businessQuery.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {business ? business.name : <Skeleton className="h-8 w-48" />}
        </h1>
        <p className="text-sm text-muted-foreground">
          {business ? `${business.location}, ${business.country}` : "Loading business details..."}
        </p>
      </div>

      {businessQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : business ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Products" value={business._count.products} icon={Package} />
          <StatCard label="Warehouses" value={business._count.warehouses} icon={Warehouse} />
          <StatCard label="Team Members" value={business._count.businessUsers} icon={Users} accent="success" />
          <StatCard label="Total Sales" value={business._count.transactions} icon={Receipt} />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Warehouses</CardTitle>
        </CardHeader>
        <CardContent>
          {business && business.warehouses.length > 0 ? (
            <ul className="divide-y divide-border">
              {business.warehouses.map((w) => (
                <li key={w.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium">{w.name}</span>
                  <span className="text-muted-foreground">
                    {w.isPrimary ? "Primary" : w.location ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No warehouses set up yet.</p>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Sales trends, stock alerts and employee reports land in the next build phase.
      </p>
    </div>
  )
}
