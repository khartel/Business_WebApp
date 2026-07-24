import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  Receipt,
  Users,
  BarChart3,
  Building2,
  Boxes,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  superAdminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/warehouses", label: "Warehouses", icon: Warehouse },
  { to: "/stock", label: "Stock Movements", icon: ArrowLeftRight },
  { to: "/transactions", label: "Sales", icon: Receipt },
  { to: "/team", label: "Team", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/businesses", label: "Businesses", icon: Building2, superAdminOnly: true },
]

export function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Boxes className="size-5" />
        </div>
        <span className="font-heading text-lg font-semibold text-white">D-Inventory</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.filter((item) => !item.superAdminOnly || user?.role === "SUPERADMIN").map(
          (item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="size-4.5 shrink-0" />
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/50">
        D-Inventory &copy; {new Date().getFullYear()}
      </div>
    </aside>
  )
}
