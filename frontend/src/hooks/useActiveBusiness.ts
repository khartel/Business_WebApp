import { useAuth } from "@/context/AuthContext"

/** The active business's summary from /auth/me (id, name, currency, country, location, role). */
export function useActiveBusiness() {
  const { user, activeBusinessId } = useAuth()
  return user?.businesses.find((b) => b.id === activeBusinessId) ?? null
}
