import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/context/AuthContext"
import { ThemeProvider } from "@/context/ThemeContext"
import * as authService from "@/services/auth.service"
import { ApiError } from "@/lib/api-client"
import type { AuthUser } from "@/types"
import Login from "./Login"

vi.mock("@/services/auth.service")

const mockUser: AuthUser = {
  id: "user-1",
  fullName: "Jane Owner",
  username: "jane_owner",
  phone: "08012345678",
  email: "jane@example.com",
  role: "SUPERADMIN",
  createdAt: new Date().toISOString(),
  businesses: [],
}

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<div>Home Page</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

describe("Login", () => {
  beforeEach(() => {
    vi.mocked(authService.getMe).mockRejectedValue(new ApiError("Not authenticated", 401))
  })

  test("shows validation errors instead of submitting when fields are empty", async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByText("Username is required")).toBeInTheDocument()
    expect(screen.getByText("Password is required")).toBeInTheDocument()
    expect(authService.login).not.toHaveBeenCalled()
  })

  test("logs in with valid credentials and navigates away from /login", async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: mockUser })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText("Username"), "jane_owner")
    await user.type(screen.getByLabelText("Password"), "password123")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    await waitFor(() => {
      expect(vi.mocked(authService.login).mock.calls[0]?.[0]).toEqual({
        username: "jane_owner",
        password: "password123",
        rememberMe: false,
      })
    })
    expect(await screen.findByText("Home Page")).toBeInTheDocument()
  })

  test("shows the server's error message and stays on the login form when credentials are wrong", async () => {
    vi.mocked(authService.login).mockRejectedValue(new ApiError("Invalid username or password", 401))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText("Username"), "jane_owner")
    await user.type(screen.getByLabelText("Password"), "wrong-password")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByText("Invalid username or password")).toBeInTheDocument()
    expect(screen.queryByText("Home Page")).not.toBeInTheDocument()
  })

  test("switches to the 6-digit code step when the account has 2FA enabled", async () => {
    vi.mocked(authService.login).mockResolvedValue({ requires2FA: true, tempToken: "temp-token-123" })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText("Username"), "jane_owner")
    await user.type(screen.getByLabelText("Password"), "password123")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByText("Two-factor authentication")).toBeInTheDocument()
    expect(screen.getByLabelText("Authentication code")).toBeInTheDocument()
  })
})
