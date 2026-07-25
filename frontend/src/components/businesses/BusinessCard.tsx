import type { ReactNode } from "react"
import { ArrowRight, Building2, Package, Receipt, Users, Warehouse } from "lucide-react"
import { cn } from "@/lib/utils"

interface BusinessCardStats {
  products: number
  warehouses: number
  team: number
  sales: number
}

interface BusinessCardProps {
  name: string
  location: string
  country: string
  currency: string
  stats?: BusinessCardStats
  isActive?: boolean
  onSelect: () => void
  actions?: ReactNode
}

export function BusinessCard({
  name,
  location,
  country,
  currency,
  stats,
  isActive,
  onSelect,
  actions,
}: BusinessCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      className={cn(
        "group relative flex flex-col gap-5 overflow-hidden rounded-3xl border p-6 text-left shadow-sm backdrop-blur-xl transition-all duration-200",
        "bg-card/60 ring-1 ring-foreground/10 hover:-translate-y-1 hover:shadow-2xl hover:ring-primary/30 dark:bg-card/40 dark:ring-white/10",
        isActive ? "border-success/50 ring-2 ring-success/40" : "border-transparent"
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "var(--glow-primary)" }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-success text-primary-foreground shadow-[0_0_20px_var(--glow-primary)]">
          <Building2 className="size-6" />
        </div>
        {actions && (
          <div className="opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>

      <div className="relative space-y-1">
        <h3 className="font-heading text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {location}, {country} · {currency}
        </p>
      </div>

      {stats && (
        <div className="relative grid grid-cols-4 gap-2 border-t border-border/60 pt-4 text-center">
          <div>
            <Package className="mx-auto mb-1 size-4 text-muted-foreground" />
            <p className="text-sm font-semibold">{stats.products}</p>
          </div>
          <div>
            <Warehouse className="mx-auto mb-1 size-4 text-muted-foreground" />
            <p className="text-sm font-semibold">{stats.warehouses}</p>
          </div>
          <div>
            <Users className="mx-auto mb-1 size-4 text-muted-foreground" />
            <p className="text-sm font-semibold">{stats.team}</p>
          </div>
          <div>
            <Receipt className="mx-auto mb-1 size-4 text-muted-foreground" />
            <p className="text-sm font-semibold">{stats.sales}</p>
          </div>
        </div>
      )}

      <div className="relative flex items-center justify-between pt-1">
        <span
          className={cn(
            "text-xs font-medium",
            isActive ? "text-success" : "text-muted-foreground"
          )}
        >
          {isActive ? "Currently active" : "Tap to enter"}
        </span>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-success" />
      </div>
    </div>
  )
}
