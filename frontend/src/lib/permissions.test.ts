import { describe, expect, test } from "vitest"
import { canManage } from "./permissions"

describe("canManage", () => {
  test("SUPERADMIN can manage", () => {
    expect(canManage("SUPERADMIN")).toBe(true)
  })

  test("ADMIN can manage", () => {
    expect(canManage("ADMIN")).toBe(true)
  })

  test("EMPLOYEE cannot manage", () => {
    expect(canManage("EMPLOYEE")).toBe(false)
  })

  test("undefined role cannot manage", () => {
    expect(canManage(undefined)).toBe(false)
  })
})
