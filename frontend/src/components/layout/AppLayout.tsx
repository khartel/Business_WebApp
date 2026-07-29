import { Outlet } from "react-router-dom"
import { AppBackground } from "@/components/AppBackground"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"

/**
 * Top-level authenticated layout: renders the decorative `AppBackground`,
 * the fixed `Sidebar` (desktop) and `Topbar` (which also hosts the mobile
 * nav sheet) side-by-side, and an `<Outlet />` for the current route's page
 * content in a scrollable main area. Used as the layout route element for
 * everything behind `ProtectedRoute`.
 */
export function AppLayout() {
  return (
    <div className="relative flex h-svh overflow-hidden">
      <AppBackground />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
