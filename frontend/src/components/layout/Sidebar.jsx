import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Warehouse,
  Users,
  Package,
  ArrowLeftRight,
  BarChart3,
  LogOut,
  X,
  TrendingUp,
  MoveRight,
  ShoppingCart,
} from "lucide-react";

const NavItem = ({ to, icon: Icon, label, end = false }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
        isActive
          ? "bg-primary-600 text-white"
          : "text-dark-400 hover:text-white hover:bg-dark-800"
      }`
    }
  >
    <Icon size={18} />
    {label}
  </NavLink>
);

export default function Sidebar({ open, onClose }) {
  const { user, logout, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Get businessId from URL if present
  const urlParts = window.location.pathname.split("/");
  const businessIndex = urlParts.indexOf("businesses");
  const businessId =
    businessIndex !== -1 ? urlParts[businessIndex + 1] : null;

  // Make sure businessId is not a sub-route keyword
  const validBusinessId =
    businessId &&
    !["new", "team", "warehouses", "products",
      "transactions", "reports", "stock"].includes(businessId)
      ? businessId
      : null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const activeBusiness = localStorage.getItem("activeBusiness")
    ? JSON.parse(localStorage.getItem("activeBusiness"))
    : null;

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full w-64 bg-dark-900 border-r border-dark-700
        flex flex-col z-30 transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">BizManager</h1>
            <p className="text-dark-400 text-xs capitalize">
              {user?.role?.toLowerCase()}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-dark-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Main */}
        <p className="text-dark-500 text-xs font-medium uppercase
                      tracking-wider px-3 mb-2">
          Main
        </p>

        <NavItem
          to="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          end
        />

        {/* SuperAdmin Only */}
        {isSuperAdmin && (
          <NavItem
            to="/businesses"
            icon={Building2}
            label="My Businesses"
          />
        )}

        {/* Business Specific Routes */}
        {validBusinessId && (
          <>
            <p className="text-dark-500 text-xs font-medium uppercase
                          tracking-wider px-3 mb-2 mt-4">
              Sales
            </p>

            <NavItem
              to={`/businesses/${validBusinessId}/transactions/new`}
              icon={ShoppingCart}
              label="New Sale"
            />

            <NavItem
              to={`/businesses/${validBusinessId}/transactions`}
              icon={ArrowLeftRight}
              label="Transactions"
            />

            <p className="text-dark-500 text-xs font-medium uppercase
                          tracking-wider px-3 mb-2 mt-4">
              Inventory
            </p>

            <NavItem
              to={`/businesses/${validBusinessId}/products`}
              icon={Package}
              label="Products"
            />

            <NavItem
              to={`/businesses/${validBusinessId}/warehouses`}
              icon={Warehouse}
              label="Warehouses"
            />

            <NavItem
              to={`/businesses/${validBusinessId}/stock`}
              icon={MoveRight}
              label="Stock Movement"
            />

            {(isSuperAdmin || isAdmin) && (
              <>
                <p className="text-dark-500 text-xs font-medium uppercase
                              tracking-wider px-3 mb-2 mt-4">
                  Management
                </p>

                <NavItem
                  to={`/businesses/${validBusinessId}/team`}
                  icon={Users}
                  label="Team"
                />

                <NavItem
                  to={`/businesses/${validBusinessId}/reports`}
                  icon={BarChart3}
                  label="Reports"
                />
              </>
            )}
          </>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-primary-600/20 rounded-full
                          flex items-center justify-center">
            <span className="text-primary-400 text-sm font-bold">
              {user?.fullName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.fullName}
            </p>
            <p className="text-dark-400 text-xs truncate">
              @{user?.username}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
                     text-dark-400 hover:text-red-400 hover:bg-red-500/10
                     text-sm font-medium transition-colors duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}