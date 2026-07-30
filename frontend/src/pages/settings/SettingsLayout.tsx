import { Outlet } from "react-router-dom"
import { Settings as SettingsIcon } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { EmptyState } from "@/components/EmptyState"

/**
 * Layout route for everything under `/settings`. Gates the whole subtree to
 * `user.role === "SUPERADMIN"` in one place (rather than each sub-page
 * repeating the check) and renders the matched child route via `<Outlet />`.
 */
export default function SettingsLayout() {
  const { user } = useAuth()

  if (!user) return null

  if (user.role !== "SUPERADMIN") {
    return (
      <EmptyState
        icon={<SettingsIcon className="size-6" />}
        title="Not available"
        description="Settings are only visible to the business owner."
      />
    )
  }

  return <Outlet />
}
