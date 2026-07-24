import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as authService from "@/services/auth.service"
import type { AuthUser } from "@/types"

const ACTIVE_BUSINESS_KEY = "d-inventory:active-business-id"

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  activeBusinessId: string | null
  setActiveBusinessId: (id: string | null) => void
  login: (input: authService.LoginInput) => Promise<AuthUser>
  logout: () => Promise<void>
  refetchMe: () => Promise<unknown>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_BUSINESS_KEY)
  )

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const user = meQuery.data ?? null

  const setActiveBusinessId = (id: string | null) => {
    setActiveBusinessIdState(id)
    if (id) {
      localStorage.setItem(ACTIVE_BUSINESS_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_BUSINESS_KEY)
    }
  }

  // Keep the active business valid: default to the first one, and clear it
  // if the user no longer belongs to the previously-selected business.
  useEffect(() => {
    if (!user) return
    const stillValid = user.businesses.some((b) => b.id === activeBusinessId)
    if (!stillValid) {
      setActiveBusinessId(user.businesses[0]?.id ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: ({ user: loggedInUser }) => {
      queryClient.setQueryData(["auth", "me"], loggedInUser)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null)
      setActiveBusinessId(null)
      queryClient.clear()
    },
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: meQuery.isLoading,
      isAuthenticated: !!user,
      activeBusinessId,
      setActiveBusinessId,
      login: async (input) => (await loginMutation.mutateAsync(input)).user,
      logout: async () => {
        await logoutMutation.mutateAsync()
      },
      refetchMe: meQuery.refetch,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, meQuery.isLoading, activeBusinessId]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
