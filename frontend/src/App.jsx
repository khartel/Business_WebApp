import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Layout
import AppLayout from "./components/layout/AppLayout";

// SuperAdmin Pages
import Businesses from "./pages/superadmin/Businesses";
import BusinessDetail from "./pages/superadmin/BusinessDetail";

// Shared Pages
import Dashboard from "./pages/Dashboard";
import Warehouses from "./pages/Warehouses";
import Team from "./pages/Team";
import Products from "./pages/Products";
import Transactions from "./pages/Transactions";
import NewTransaction from "./pages/NewTransaction";
import Reports from "./pages/Reports";
import StockMovement from "./pages/StockMovement";
import WarehouseDetail from "./pages/WarehouseDetail";

// Loading spinner
const LoadingScreen = () => (
  <div className="min-h-screen bg-dark-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-dark-400 text-sm">Loading...</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public route wrapper
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Inner app with routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* SuperAdmin Only */}
        <Route
          path="businesses"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <Businesses />
            </ProtectedRoute>
          }
        />
        <Route
          path="businesses/:businessId"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <BusinessDetail />
            </ProtectedRoute>
          }
        />

        {/* Shared Routes */}
        <Route
          path="businesses/:businessId/warehouses"
          element={<Warehouses />}
        />
        <Route
          path="businesses/:businessId/team"
          element={
            <ProtectedRoute roles={["SUPERADMIN", "ADMIN"]}>
              <Team />
            </ProtectedRoute>
          }
        />
        <Route
          path="businesses/:businessId/products"
          element={<Products />}
        />
        <Route
          path="businesses/:businessId/transactions"
          element={<Transactions />}
        />
        <Route
          path="businesses/:businessId/transactions/new"
          element={<NewTransaction />}
        />
        <Route
          path="businesses/:businessId/stock"
          element={<StockMovement />}
        />
        <Route
          path="businesses/:businessId/warehouses/:warehouseId"
          element={<WarehouseDetail />}
        />
        <Route
          path="businesses/:businessId/reports"
          element={
            <ProtectedRoute roles={["SUPERADMIN", "ADMIN"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Route>
      

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}