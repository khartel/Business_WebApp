import { apiClient, apiRequest } from "@/lib/api-client"
import type { Role } from "@/types"

export interface TeamMember {
  id: string
  businessId: string
  userId: string
  role: Role
  createdAt: string
  user: {
    id: string
    fullName: string
    username: string
    phone: string
    email: string | null
    role: Role
    createdAt?: string
  }
}

export interface AddTeamMemberInput {
  fullName: string
  username: string
  phone: string
  email?: string
  role: "ADMIN" | "EMPLOYEE"
}

export interface AddTeamMemberResult extends TeamMember {
  defaultPassword?: string
}

export const getTeamMembers = (businessId: string) =>
  apiRequest<TeamMember[]>(apiClient.get(`/businesses/${businessId}/team`))

export const addTeamMember = (businessId: string, input: AddTeamMemberInput) =>
  apiRequest<AddTeamMemberResult>(apiClient.post(`/businesses/${businessId}/team`, input))

export const updateTeamMemberRole = (businessId: string, businessUserId: string, role: "ADMIN" | "EMPLOYEE") =>
  apiRequest<TeamMember>(apiClient.patch(`/businesses/${businessId}/team/${businessUserId}`, { role }))

export const removeTeamMember = (businessId: string, businessUserId: string) =>
  apiRequest<null>(apiClient.delete(`/businesses/${businessId}/team/${businessUserId}`))
