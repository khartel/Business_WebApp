// Shared TypeScript types used across the frontend (auth session shape,
// role model, business summaries). Service-specific types (Product,
// Transaction, etc.) live in their respective `services/*.service.ts` files.

// A user's permission level. See lib/permissions.ts for the role hierarchy
// (SUPERADMIN > ADMIN > EMPLOYEE) and how it gates UI actions.
export type Role = "SUPERADMIN" | "ADMIN" | "EMPLOYEE"

// A lightweight view of one business a user belongs to, as embedded in
// `AuthUser.businesses`. Used to populate the business switcher and to
// render receipt branding. `businessUserId`/`roleInBusiness` identify this
// user's specific membership row and role within this particular business
// (a user can hold different roles across different businesses).
export interface BusinessSummary {
  id: string
  name: string
  country: string
  currency: string
  location: string
  receiptTitle: string
  receiptFooterNote: string
  receiptShowSignature: boolean
  businessUserId?: string
  roleInBusiness?: Role
}

// The currently authenticated user, as returned by GET /auth/me and cached
// by AuthContext. `role` is the user's global account role (distinct from
// `roleInBusiness` on each entry in `businesses`, which is per-business).
// `mustChangePassword` flags accounts that were given a temporary/default
// password and need to set a real one before proceeding.
export interface AuthUser {
  id: string
  fullName: string
  username: string
  phone: string
  email: string | null
  role: Role
  mustChangePassword?: boolean
  twoFactorEnabled?: boolean
  createdAt: string
  updatedAt?: string
  businesses: BusinessSummary[]
}
