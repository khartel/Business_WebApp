// Wrappers around the /businesses/:businessId/team endpoints — managing
// which users belong to a business and what role they hold there.
import { apiClient, apiRequest } from "@/lib/api-client"
import type { Role } from "@/types"

// A membership record linking a user to a business with a specific role.
// Note both the membership itself (`role` at the top level, i.e. the role
// within this business) and the embedded `user.role` (the user's global
// account role) are present — they're typically the same but modeled
// separately since a user's business-level role can be changed independently.
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

// Fields for inviting/creating a new team member. Only ADMIN or EMPLOYEE
// can be assigned this way (SUPERADMIN is reserved for business owners).
export interface AddTeamMemberInput {
  fullName: string
  username: string
  phone: string
  email?: string
  role: "ADMIN" | "EMPLOYEE"
}

// Result of adding a team member. `defaultPassword` is present when the
// backend auto-generates a starter password for the new account (shown once
// to the admin so they can hand it to the new team member).
export interface AddTeamMemberResult extends TeamMember {
  defaultPassword?: string
}

/** Lists all team members belonging to a business. */
export const getTeamMembers = (businessId: string) =>
  apiRequest<TeamMember[]>(apiClient.get(`/businesses/${businessId}/team`))

/** Creates a new user account and adds them to the business's team. */
export const addTeamMember = (businessId: string, input: AddTeamMemberInput) =>
  apiRequest<AddTeamMemberResult>(apiClient.post(`/businesses/${businessId}/team`, input))

/** Changes a team member's role within the business (ADMIN or EMPLOYEE). */
export const updateTeamMemberRole = (businessId: string, businessUserId: string, role: "ADMIN" | "EMPLOYEE") =>
  apiRequest<TeamMember>(apiClient.patch(`/businesses/${businessId}/team/${businessUserId}`, { role }))

/** Removes a team member from the business. */
export const removeTeamMember = (businessId: string, businessUserId: string) =>
  apiRequest<null>(apiClient.delete(`/businesses/${businessId}/team/${businessUserId}`))

/** Force-resets a team member's password, returning the newly generated one. */
export const resetTeamMemberPassword = (businessId: string, businessUserId: string) =>
  apiRequest<{ username: string; newPassword: string }>(
    apiClient.post(`/businesses/${businessId}/team/${businessUserId}/reset-password`)
  )
