import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Building2, Package, Warehouse, Users, Receipt } from "lucide-react"
import * as businessService from "@/services/business.service"
import { useAuth } from "@/context/AuthContext"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/EmptyState"
import { CreateBusinessDialog } from "@/components/businesses/CreateBusinessDialog"
import { EditBusinessDialog } from "@/components/businesses/EditBusinessDialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function Businesses() {
  const { user, activeBusinessId, setActiveBusinessId } = useAuth()
  const navigate = useNavigate()

  const businessesQuery = useQuery({
    queryKey: ["businesses"],
    queryFn: businessService.getMyBusinesses,
    enabled: user?.role === "SUPERADMIN",
  })

  if (user?.role !== "SUPERADMIN") {
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
      <PageHeader
        title="Businesses"
        description="Every business you own, in one place."
        action={<CreateBusinessDialog onCreated={(id) => setActiveBusinessId(id)} />}
      />

      {businessesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="No businesses yet"
          description="Create your first business to start tracking inventory and sales."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {businesses.map((business) => (
            <Card key={business.id} className={business.id === activeBusinessId ? "border-primary" : ""}>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-semibold">{business.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {business.location}, {business.country} · {business.currency}
                    </p>
                  </div>
                  <EditBusinessDialog business={business} />
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <Package className="mx-auto mb-1 size-4 text-muted-foreground" />
                    <p className="font-semibold">{business._count.products}</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                  <div>
                    <Warehouse className="mx-auto mb-1 size-4 text-muted-foreground" />
                    <p className="font-semibold">{business._count.warehouses}</p>
                    <p className="text-xs text-muted-foreground">Warehouses</p>
                  </div>
                  <div>
                    <Users className="mx-auto mb-1 size-4 text-muted-foreground" />
                    <p className="font-semibold">{business._count.businessUsers}</p>
                    <p className="text-xs text-muted-foreground">Team</p>
                  </div>
                  <div>
                    <Receipt className="mx-auto mb-1 size-4 text-muted-foreground" />
                    <p className="font-semibold">{business._count.transactions}</p>
                    <p className="text-xs text-muted-foreground">Sales</p>
                  </div>
                </div>

                <Button
                  variant={business.id === activeBusinessId ? "secondary" : "outline"}
                  className="w-full"
                  onClick={() => {
                    setActiveBusinessId(business.id)
                    navigate("/dashboard")
                  }}
                >
                  {business.id === activeBusinessId ? "Currently active" : "Switch to this business"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
