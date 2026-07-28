import { apiClient, apiRequest } from "@/lib/api-client"
import type { AuthUser } from "@/types"

export interface LoginInput {
  username: string
  password: string
  rememberMe?: boolean
}

export interface RegisterInput {
  fullName: string
  username: string
  phone: string
  email?: string
  password: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface UpdateProfileInput {
  fullName?: string
  phone?: string
  email?: string
}

export const login = (input: LoginInput) =>
  apiRequest<{ user: AuthUser }>(apiClient.post("/auth/login", input))

export const register = (input: RegisterInput) =>
  apiRequest<AuthUser>(apiClient.post("/auth/register", input))

export const logout = () => apiRequest<null>(apiClient.post("/auth/logout"))

export const getMe = () => apiRequest<AuthUser>(apiClient.get("/auth/me"))

export const changePassword = (input: ChangePasswordInput) =>
  apiRequest<null>(apiClient.post("/auth/change-password", input))

export const updateProfile = (input: UpdateProfileInput) =>
  apiRequest<AuthUser>(apiClient.patch("/auth/me", input))
