import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Loader2 } from "lucide-react"

/**
 * Route guard rendered as a layout route wrapping protected pages (renders
 * `<Outlet />` for whatever child route matched). While auth state is still
 * being resolved it shows a full-screen spinner; if the user isn't
 * authenticated it redirects to `/login`; if the user must change their
 * password it forces them to `/change-password` until that's done.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // NOTE: on logout, `isAuthenticated` flips to false before the imperative
    // navigate("/login") elsewhere runs, so this redirect can fire first and
    // capture `location` as the pre-logout page. That means `state.from` here
    // isn't always the page the user actually intended to return to — it can
    // be stale from the logout transition rather than a genuine "redirected
    // while trying to visit X" case.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}
