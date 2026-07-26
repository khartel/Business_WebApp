import { Link, NavLink } from "react-router-dom"
import {
  Store,
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  Users,
  Contact,
  BarChart3,
  Boxes,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "Register", icon: Store },
  { to: "/customers", label: "Customers", icon: Contact },
  { to: "/products", label: "Products", icon: Package },
  { to: "/warehouses", label: "Warehouses", icon: Warehouse },
  { to: "/stock", label: "Stock Movements", icon: ArrowLeftRight },
  { to: "/team", label: "Team", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
]

export function SidebarBrand() {
  return (
    <Link to="/" className="flex h-16 items-center gap-2 px-6 transition-opacity hover:opacity-80">
      <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_0_16px_var(--glow-primary)]">
        <Boxes className="size-5" />
      </div>
      <span className="font-heading text-lg font-semibold text-white">D-Inventory</span>
    </Link>
  )
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
              isActive
                ? "bg-gradient-to-r from-sidebar-primary to-emerald-400 text-sidebar-primary-foreground shadow-[0_0_20px_var(--glow-primary)]"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )
          }
        >
          <item.icon className="size-4.5 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/85 text-sidebar-foreground backdrop-blur-2xl lg:flex">
      <SidebarBrand />
      <SidebarNav />
      <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/40">
        D-Inventory &copy; {new Date().getFullYear()}
      </div>
    </aside>
  )
}
