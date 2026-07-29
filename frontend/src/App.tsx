import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Login from "@/pages/auth/Login"
import Register from "@/pages/auth/Register"
import ChangePassword from "@/pages/ChangePassword"
import SelectBusiness from "@/pages/SelectBusiness"
import Pos from "@/pages/Pos"
import Customers from "@/pages/Customers"
import Dashboard from "@/pages/Dashboard"
import Warehouses from "@/pages/Warehouses"
import Products from "@/pages/Products"
import Team from "@/pages/Team"
import StockMovements from "@/pages/StockMovements"
import Reports from "@/pages/Reports"
import Businesses from "@/pages/Businesses"
import Settings from "@/pages/Settings"
import PlatformAdmin from "@/pages/PlatformAdmin"

/**
 * Top-level route tree for the app.
 *
 * - `/login`, `/register`, `/platform-admin` are public — no auth required.
 *   `/platform-admin` is the separate master-key-gated screen for managing
 *   SuperAdmin accounts (see services/platform.service.ts), not part of the
 *   normal per-business role system.
 * - Everything else is nested under `<ProtectedRoute />`, a layout route
 *   (components/ProtectedRoute.tsx) that redirects unauthenticated users to
 *   `/login` and forces users with `mustChangePassword` set to
 *   `/change-password` before they can reach anything else. Note this only
 *   gates on "is logged in", not on business role — per-role UI is instead
 *   controlled within individual pages/components via
 *   `lib/permissions.ts` (`canManage`) and each page's own checks.
 * - `/` (SelectBusiness) lets a user pick which of their businesses to
 *   operate in (see hooks/useActiveBusiness.ts) before reaching business
 *   data screens.
 * - The remaining business-scoped pages (POS, customers, dashboard,
 *   products, warehouses, stock, team, reports, businesses, settings) are
 *   further nested under `<AppLayout />`, which renders the shared
 *   sidebar/topbar chrome around each page's content.
 * - Any unmatched path falls back to redirecting to `/`.
 */
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/platform-admin" element={<PlatformAdmin />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/" element={<SelectBusiness />} />

        <Route element={<AppLayout />}>
          <Route path="/pos" element={<Pos />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/stock" element={<StockMovements />} />
          <Route path="/team" element={<Team />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/businesses" element={<Businesses />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
