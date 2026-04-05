import { Menu, Bell, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();

  // Get active business from localStorage
  const activeBusiness = localStorage.getItem("activeBusiness")
    ? JSON.parse(localStorage.getItem("activeBusiness"))
    : null;

  return (
    <header className="sticky top-0 z-10 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700 px-4 md:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left - Menu button + Business name */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-dark-400 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>

          {activeBusiness && (
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-primary-400" />
              <span className="text-white font-medium text-sm">
                {activeBusiness.name}
              </span>
              <span className="badge-blue">
                {activeBusiness.currency}
              </span>
            </div>
          )}
        </div>

        {/* Right - Notifications + User */}
        <div className="flex items-center gap-3">
          <button className="relative text-dark-400 hover:text-white transition-colors p-2">
            <Bell size={20} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center">
              <span className="text-primary-400 text-sm font-bold">
                {user?.fullName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-white text-sm font-medium">
                {user?.fullName}
              </p>
              <p className="text-dark-400 text-xs capitalize">
                {user?.role?.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}