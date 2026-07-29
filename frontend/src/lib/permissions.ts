// Client-side helpers for gating UI based on a user's role within a
// business. These exist purely to hide/show/disable UI affordances early —
// the backend independently re-enforces the same rules on every request, so
// this file must never be the only line of defense.
//
// Role hierarchy (highest to lowest privilege):
//   SUPERADMIN - owns the business; full access to everything.
//   ADMIN      - trusted staff; can manage products/team/settings but isn't the owner.
//   EMPLOYEE   - front-line staff; typically limited to POS/sales operations,
//                cannot manage team members, products, or business settings.
import type { Role } from "@/types"

/**
 * True if `role` is allowed to perform management actions (adding/editing
 * products, team members, warehouses, business settings, etc.) — i.e. the
 * role is SUPERADMIN or ADMIN, but not EMPLOYEE. Mirrors the backend's
 * `authorize("SUPERADMIN", "ADMIN")` gate used on every management endpoint,
 * so keep this in sync if the backend's allowed roles ever change.
 */
export function canManage(role: Role | undefined) {
  return role === "SUPERADMIN" || role === "ADMIN"
}
