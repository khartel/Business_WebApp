import type { Role } from "@/types"

/** Mirrors the backend's authorize("SUPERADMIN", "ADMIN") gate used on every management endpoint. */
export function canManage(role: Role | undefined) {
  return role === "SUPERADMIN" || role === "ADMIN"
}
