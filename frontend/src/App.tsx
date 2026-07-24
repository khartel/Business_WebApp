import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Login from "@/pages/auth/Login"
import Register from "@/pages/auth/Register"
import ChangePassword from "@/pages/ChangePassword"
import Dashboard from "@/pages/Dashboard"
import ComingSoon from "@/pages/ComingSoon"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<ComingSoon title="Products" />} />
          <Route path="/warehouses" element={<ComingSoon title="Warehouses" />} />
          <Route path="/stock" element={<ComingSoon title="Stock Movements" />} />
          <Route path="/transactions" element={<ComingSoon title="Sales" />} />
          <Route path="/team" element={<ComingSoon title="Team" />} />
          <Route path="/reports" element={<ComingSoon title="Reports" />} />
          <Route path="/businesses" element={<ComingSoon title="Businesses" />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
