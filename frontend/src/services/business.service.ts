// Wrappers around the /businesses endpoints: CRUD for a business itself
// (as opposed to its products/customers/etc., which have their own service
// files) plus the country/currency picklist used at business-creation time.
import { apiClient, apiRequest } from "@/lib/api-client"

// Full business record as returned by GET /businesses/:id — includes
// warehouses, team members (businessUsers), and aggregate counts.
export interface BusinessDetail {
  id: string
  name: string
  phone: string
  email: string | null
  country: string
  location: string
  currency: string
  createdAt: string
  warehouses: Array<{ id: string; name: string; isPrimary: boolean; location: string | null }>
  businessUsers: Array<{
    id: string
    role: string
    user: { id: string; fullName: string; username: string; role: string }
  }>
  _count: {
    businessUsers: number
    warehouses: number
    products: number
    transactions: number
  }
}

// Lighter-weight business record used for list views (GET /businesses) —
// same aggregate counts as `BusinessDetail` but without team member details.
export interface BusinessListItem {
  id: string
  name: string
  phone: string
  email: string | null
  country: string
  location: string
  currency: string
  createdAt: string
  warehouses: Array<{ id: string; name: string; location: string | null }>
  _count: {
    businessUsers: number
    warehouses: number
    products: number
    transactions: number
  }
}

// A country supported at signup, paired with the currency that gets locked
// in for any business created under that country.
export interface CountryOption {
  country: string
  currency: { code: string; name: string; symbol: string }
}

// Fields required to create a new business. Currency is derived server-side
// from `country`, not supplied directly.
export interface CreateBusinessInput {
  name: string
  phone: string
  email?: string
  country: string
  location: string
}

// Editable business fields, including receipt-branding customization
// (title/footer text/whether to show a signature line on printed receipts).
export interface UpdateBusinessInput {
  name?: string
  phone?: string
  email?: string
  location?: string
  receiptTitle?: string
  receiptFooterNote?: string
  receiptShowSignature?: boolean
}

/** Fetches full details for one business. */
export const getBusinessById = (businessId: string) =>
  apiRequest<BusinessDetail>(apiClient.get(`/businesses/${businessId}`))

/** Lists every business the current user belongs to (as owner or team member). */
export const getMyBusinesses = () => apiRequest<BusinessListItem[]>(apiClient.get("/businesses"))

/** Fetches the supported country/currency options shown on the create-business form. */
export const getCountries = () => apiRequest<CountryOption[]>(apiClient.get("/businesses/countries"))

/** Creates a new business owned by the current user. */
export const createBusiness = (input: CreateBusinessInput) =>
  apiRequest<BusinessDetail>(apiClient.post("/businesses", input))

/** Updates a business's editable fields (including receipt branding). */
export const updateBusiness = (businessId: string, input: UpdateBusinessInput) =>
  apiRequest<BusinessDetail>(apiClient.patch(`/businesses/${businessId}`, input))

/** Permanently deletes a business. */
export const deleteBusiness = (businessId: string) =>
  apiRequest<null>(apiClient.delete(`/businesses/${businessId}`))
