export type Role = "SUPERADMIN" | "ADMIN" | "EMPLOYEE"

export interface BusinessSummary {
  id: string
  name: string
  country: string
  currency: string
  location: string
  businessUserId?: string
  roleInBusiness?: Role
}

export interface AuthUser {
  id: string
  fullName: string
  username: string
  phone: string
  email: string | null
  role: Role
  mustChangePassword?: boolean
  createdAt: string
  updatedAt?: string
  businesses: BusinessSummary[]
}
