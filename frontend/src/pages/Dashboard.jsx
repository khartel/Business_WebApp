import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { businessService } from "../services/business.service";
import {
  Building2,
  Plus,
  Users,
  Warehouse,
  Package,
  ArrowRight,
  TrendingUp,
  MapPin,
  Globe,
} from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import CreateBusinessForm from "../components/business/CreateBusinessForm";

export default function Dashboard() {
  const { user, isSuperAdmin, getUserBusinesses } = useAuth();
  const navigate = useNavigate();
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);

  // ─────────────────────────────────────────
  // SUPERADMIN — fetch their businesses
  // ─────────────────────────────────────────
  const {
    data: businessesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessService.getAll,
    enabled: isSuperAdmin,
  });

  const superAdminBusinesses = businessesData?.data || [];

  // ─────────────────────────────────────────
  // ADMIN / EMPLOYEE — get businesses from user object
  // ─────────────────────────────────────────
  const employeeBusinesses = getUserBusinesses(user);

  // ─────────────────────────────────────────
  // ADMIN/EMPLOYEE REDIRECT LOGIC
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!isSuperAdmin && user) {
      const businesses = getUserBusinesses(user);

      if (businesses.length === 0) {
        // This shouldn't happen but handle gracefully
        return;
      }

      if (businesses.length === 1) {
        // Only one business → go straight in
        const business = businesses[0];
        localStorage.setItem("activeBusiness", JSON.stringify(business));
        navigate(`/businesses/${business.id}/transactions/new`);
      }
      // Multiple businesses → stay on dashboard to pick
    }
  }, [user, isSuperAdmin]);

  // ─────────────────────────────────────────
  // ENTER A BUSINESS
  // ─────────────────────────────────────────
  const enterBusiness = (business) => {
    localStorage.setItem("activeBusiness", JSON.stringify(business));
    navigate(`/businesses/${business.id}/transactions/new`);
  };

  // ─────────────────────────────────────────
  // ADMIN/EMPLOYEE WITH MULTIPLE BUSINESSES
  // ─────────────────────────────────────────
  if (!isSuperAdmin && employeeBusinesses.length > 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.fullName?.split(" ")[0]} 👋
          </h1>
          <p className="text-dark-400 mt-1">
            You belong to multiple businesses. Select one to continue.
          </p>
        </div>

        <div className="space-y-4">
          {employeeBusinesses.map((business) => (
            <button
              key={business.id}
              onClick={() => enterBusiness(business)}
              className="w-full card p-6 text-left hover:border-primary-500/50
                         transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-600/20 rounded-xl
                                  flex items-center justify-center">
                    <Building2 size={22} className="text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {business.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={12} className="text-dark-400" />
                      <span className="text-dark-400 text-sm">
                        {business.location}
                      </span>
                      <span className="badge-blue">{business.currency}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight
                  size={20}
                  className="text-dark-500 group-hover:text-primary-400
                             transition-colors"
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // ADMIN/EMPLOYEE WITH NO BUSINESSES
  // ─────────────────────────────────────────
  if (!isSuperAdmin && employeeBusinesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center
                        justify-center mb-4">
          <Building2 size={28} className="text-dark-500" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">
          No Business Assigned
        </h3>
        <p className="text-dark-400 text-sm max-w-sm">
          You have not been assigned to any business yet.
          Contact your business owner or admin.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // SUPERADMIN LOADING
  // ─────────────────────────────────────────
  if (isSuperAdmin && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600
                        border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─────────────────────────────────────────
  // SUPERADMIN DASHBOARD
  // ─────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.fullName?.split(" ")[0]} 👋
          </h1>
          <p className="text-dark-400 mt-1">
            {superAdminBusinesses.length === 0
              ? "Get started by creating your first business"
              : `You have ${superAdminBusinesses.length} business${
                  superAdminBusinesses.length > 1 ? "es" : ""
                }`}
          </p>
        </div>

        <Button onClick={() => setShowCreateBusiness(true)}>
          <Plus size={18} />
          Add Business
        </Button>
      </div>

      {/* No Business State */}
      {superAdminBusinesses.length === 0 && (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-primary-600/10 rounded-2xl
                          flex items-center justify-center mb-6">
            <Building2 size={36} className="text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            No businesses yet
          </h2>
          <p className="text-dark-400 text-sm max-w-sm mb-8">
            Create your first business to start managing transactions,
            inventory and your team.
          </p>
          <Button onClick={() => setShowCreateBusiness(true)}>
            <Plus size={18} />
            Create Your First Business
          </Button>
        </div>
      )}

      {/* Business Cards Grid */}
      {superAdminBusinesses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {superAdminBusinesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              onEnter={() => enterBusiness(business)}
            />
          ))}

          {/* Add Another Business Card */}
          <button
            onClick={() => setShowCreateBusiness(true)}
            className="card p-6 border-dashed border-dark-600
                       hover:border-primary-500/50 hover:bg-dark-800/50
                       transition-all duration-200 flex flex-col
                       items-center justify-center gap-3 min-h-48"
          >
            <div className="w-12 h-12 bg-dark-700 rounded-xl
                            flex items-center justify-center">
              <Plus size={22} className="text-dark-400" />
            </div>
            <p className="text-dark-400 text-sm font-medium">
              Add Another Business
            </p>
          </button>
        </div>
      )}

      {/* Create Business Modal */}
      <Modal
        isOpen={showCreateBusiness}
        onClose={() => setShowCreateBusiness(false)}
        title="Create New Business"
        size="lg"
      >
        <CreateBusinessForm
          onSuccess={() => {
            setShowCreateBusiness(false);
            refetch();
          }}
          onCancel={() => setShowCreateBusiness(false)}
        />
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────
// BUSINESS CARD COMPONENT
// ─────────────────────────────────────────
function BusinessCard({ business, onEnter }) {
  const counts = business._count || {};

  return (
    <div className="card p-6 hover:border-dark-600 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600/20 rounded-xl
                          flex items-center justify-center flex-shrink-0">
            <Building2 size={22} className="text-primary-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold truncate">
              {business.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Globe size={11} className="text-dark-400" />
              <span className="text-dark-400 text-xs">{business.country}</span>
            </div>
          </div>
        </div>
        <span className="badge-blue flex-shrink-0">{business.currency}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-dark-800 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Users size={14} className="text-dark-400" />
          </div>
          <p className="text-white font-bold text-lg">
            {counts.businessUsers || 0}
          </p>
          <p className="text-dark-500 text-xs">Team</p>
        </div>

        <div className="bg-dark-800 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Warehouse size={14} className="text-dark-400" />
          </div>
          <p className="text-white font-bold text-lg">
            {counts.warehouses || 0}
          </p>
          <p className="text-dark-500 text-xs">Warehouses</p>
        </div>

        <div className="bg-dark-800 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Package size={14} className="text-dark-400" />
          </div>
          <p className="text-white font-bold text-lg">
            {counts.products || 0}
          </p>
          <p className="text-dark-500 text-xs">Products</p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 mb-6">
        <MapPin size={13} className="text-dark-500 flex-shrink-0" />
        <span className="text-dark-400 text-sm truncate">
          {business.location}
        </span>
      </div>

      {/* Enter Button */}
      <button
        onClick={onEnter}
        className="w-full flex items-center justify-center gap-2
                   bg-primary-600 hover:bg-primary-700 text-white
                   font-medium py-2.5 rounded-lg transition-colors duration-200"
      >
        <TrendingUp size={16} />
        Enter Business
        <ArrowRight size={16} />
      </button>
    </div>
  );
}