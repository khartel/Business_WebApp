import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { platformService } from "../services/platform.service";
import {
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Building2,
  Users,
  Package,
  ArrowLeftRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";

// ─────────────────────────────────────────
// CONFIRM DELETE MODAL
// ─────────────────────────────────────────
function ConfirmDeleteModal({ superAdmin, onConfirm, onCancel, isLoading }) {
  if (!superAdmin) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
    >
      <div className="bg-dark-900 border border-dark-700 rounded-2xl
                      w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-dark-700">
          <div className="w-10 h-10 bg-red-500/20 rounded-xl
                          flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Delete SuperAdmin</h3>
            <p className="text-dark-400 text-xs mt-0.5">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-dark-300 text-sm mb-4">
            You are about to permanently delete:
          </p>
          <div className="bg-dark-800 rounded-xl p-4 mb-4">
            <p className="text-white font-semibold">
              {superAdmin.fullName}
            </p>
            <p className="text-dark-400 text-sm">
              @{superAdmin.username}
            </p>
            {superAdmin.ownedBusinesses?.length > 0 && (
              <p className="text-red-400 text-xs mt-2">
                ⚠️ This will also delete{" "}
                {superAdmin.ownedBusinesses.length} business
                {superAdmin.ownedBusinesses.length !== 1 ? "es" : ""} and
                all their data permanently
              </p>
            )}
          </div>
          <p className="text-dark-500 text-xs">
            All businesses, products, transactions, warehouses and team
            members associated with this account will be deleted.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-dark-600
                       text-dark-300 text-sm font-medium hover:border-dark-500
                       hover:text-white transition-colors
                       disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600
                       hover:bg-red-500 text-white text-sm font-medium
                       transition-colors disabled:opacity-50
                       flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white
                                border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Yes, Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────
export default function PlatformAdmin() {
  const queryClient = useQueryClient();

  const [masterKey, setMasterKey] = useState("");
  const [submittedKey, setSubmittedKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isUnlocked = !!submittedKey;

  // ─────────────────────────────────────────
  // FETCH SUPERADMINS
  // ─────────────────────────────────────────
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["platform-superadmins", submittedKey],
    queryFn: () => platformService.getAll(submittedKey),
    enabled: isUnlocked,
    retry: false,
  });

  const superAdmins = data?.data || [];

  // Handle wrong key
  const wrongKey = isError &&
    error?.response?.status === 403 ||
    error?.response?.status === 401;

  // ─────────────────────────────────────────
  // DELETE MUTATION
  // ─────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (userId) =>
      platformService.deleteSuperAdmin(submittedKey, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(["platform-superadmins"]);
      setDeleteTarget(null);
    },
  });

  // ─────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────
  const handleUnlock = (e) => {
    e.preventDefault();
    if (!masterKey.trim()) {
      setKeyError("Please enter the master key");
      return;
    }
    setKeyError("");
    setSubmittedKey(masterKey.trim());
  };

  const handleLock = () => {
    setSubmittedKey("");
    setMasterKey("");
    setExpandedId(null);
    setDeleteTarget(null);
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ─────────────────────────────────────────
  // LOCK SCREEN
  // ─────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center
                      justify-center p-4">
        <div className="w-full max-w-sm">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600/20 rounded-2xl
                            flex items-center justify-center">
              <Shield size={32} className="text-primary-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-white text-2xl font-bold mb-1">
              Platform Admin
            </h1>
            <p className="text-dark-400 text-sm">
              Enter your master key to access this area
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="text-dark-400 text-xs font-medium
                                block mb-1.5">
                Master Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="Enter master key..."
                  value={masterKey}
                  onChange={(e) => {
                    setMasterKey(e.target.value);
                    setKeyError("");
                  }}
                  className={`input-base pr-10 ${
                    keyError ? "border-red-500" : ""
                  }`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-dark-400 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {keyError && (
                <p className="text-red-400 text-xs mt-1">{keyError}</p>
              )}
              {wrongKey && (
                <p className="text-red-400 text-xs mt-1">
                  Invalid master key. Access denied.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary-600 hover:bg-primary-500
                         text-white font-semibold rounded-xl
                         transition-colors flex items-center
                         justify-center gap-2"
            >
              <Shield size={18} />
              Unlock
            </button>
          </form>

          <p className="text-dark-600 text-xs text-center mt-6">
            This page is restricted to platform administrators only
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950 p-6">

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        superAdmin={deleteTarget}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600/20 rounded-xl
                            flex items-center justify-center">
              <Shield size={20} className="text-primary-400" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">
                Platform Admin
              </h1>
              <p className="text-dark-400 text-sm">
                {superAdmins.length} SuperAdmin
                {superAdmins.length !== 1 ? "s" : ""} on the platform
              </p>
            </div>
          </div>

          {/* Lock button */}
          <button
            onClick={handleLock}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                       border border-dark-600 hover:border-red-500/50
                       hover:bg-red-500/10 text-dark-400
                       hover:text-red-400 transition-all text-sm"
          >
            <X size={16} />
            Lock
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">Total SuperAdmins</p>
            <p className="text-white text-2xl font-bold">
              {superAdmins.length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">Total Businesses</p>
            <p className="text-white text-2xl font-bold">
              {superAdmins.reduce(
                (sum, sa) => sum + (sa.ownedBusinesses?.length || 0),
                0
              )}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">
              SuperAdmins with No Business
            </p>
            <p className="text-yellow-400 text-2xl font-bold">
              {superAdmins.filter(
                (sa) => sa.ownedBusinesses?.length === 0
              ).length}
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary-600
                            border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* SuperAdmins List */}
        {!isLoading && (
          <div className="space-y-4">
            {superAdmins.length === 0 && (
              <div className="card p-12 text-center">
                <Shield size={40} className="text-dark-600 mx-auto mb-4" />
                <p className="text-white font-medium">
                  No SuperAdmins found
                </p>
                <p className="text-dark-400 text-sm mt-1">
                  No users have registered yet
                </p>
              </div>
            )}

            {superAdmins.map((sa) => (
              <div key={sa.id} className="card overflow-hidden">

                {/* SuperAdmin Header Row */}
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-primary-600/20 rounded-xl
                                    flex items-center justify-center
                                    flex-shrink-0">
                      <span className="text-primary-400 font-bold text-lg">
                        {sa.fullName?.charAt(0)}
                      </span>
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold">
                          {sa.fullName}
                        </p>
                        <span className="badge-blue">SuperAdmin</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1
                                      flex-wrap">
                        <span className="text-dark-400 text-xs">
                          @{sa.username}
                        </span>
                        {sa.email && (
                          <span className="text-dark-400 text-xs">
                            {sa.email}
                          </span>
                        )}
                        <span className="text-dark-400 text-xs">
                          {sa.phone}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar size={10} className="text-dark-500" />
                          <span className="text-dark-500 text-xs">
                            Joined {formatDate(sa.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Business Count */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5
                                    bg-dark-800 rounded-lg">
                      <Building2 size={13} className="text-dark-400" />
                      <span className="text-dark-300 text-xs">
                        {sa.ownedBusinesses?.length} business
                        {sa.ownedBusinesses?.length !== 1 ? "es" : ""}
                      </span>
                    </div>

                    {/* Expand */}
                    {sa.ownedBusinesses?.length > 0 && (
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === sa.id ? null : sa.id
                          )
                        }
                        className="p-2 bg-dark-800 hover:bg-dark-700
                                   rounded-lg text-dark-400
                                   hover:text-white transition-colors"
                      >
                        {expandedId === sa.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(sa)}
                      className="p-2 bg-dark-800 hover:bg-red-500/20
                                 rounded-lg text-dark-400
                                 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Businesses */}
                {expandedId === sa.id && sa.ownedBusinesses?.length > 0 && (
                  <div className="border-t border-dark-700 p-5">
                    <p className="text-dark-400 text-xs font-medium
                                  uppercase tracking-wider mb-3">
                      Businesses
                    </p>
                    <div className="space-y-3">
                      {sa.ownedBusinesses.map((business) => (
                        <div
                          key={business.id}
                          className="bg-dark-800 rounded-xl p-4"
                        >
                          <div className="flex items-start
                                          justify-between mb-3">
                            <div>
                              <p className="text-white font-medium">
                                {business.name}
                              </p>
                              <p className="text-dark-400 text-xs mt-0.5">
                                {business.country} •{" "}
                                {business.currency} •{" "}
                                Created {formatDate(business.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Business Stats */}
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-dark-700 rounded-lg p-2
                                            text-center">
                              <div className="flex items-center
                                              justify-center gap-1 mb-1">
                                <ArrowLeftRight
                                  size={11}
                                  className="text-dark-400"
                                />
                              </div>
                              <p className="text-white text-sm font-bold">
                                {business._count?.transactions || 0}
                              </p>
                              <p className="text-dark-500 text-xs">
                                Sales
                              </p>
                            </div>
                            <div className="bg-dark-700 rounded-lg p-2
                                            text-center">
                              <div className="flex items-center
                                              justify-center gap-1 mb-1">
                                <Package
                                  size={11}
                                  className="text-dark-400"
                                />
                              </div>
                              <p className="text-white text-sm font-bold">
                                {business._count?.products || 0}
                              </p>
                              <p className="text-dark-500 text-xs">
                                Products
                              </p>
                            </div>
                            <div className="bg-dark-700 rounded-lg p-2
                                            text-center">
                              <div className="flex items-center
                                              justify-center gap-1 mb-1">
                                <Building2
                                  size={11}
                                  className="text-dark-400"
                                />
                              </div>
                              <p className="text-white text-sm font-bold">
                                {business._count?.warehouses || 0}
                              </p>
                              <p className="text-dark-500 text-xs">
                                Warehouses
                              </p>
                            </div>
                            <div className="bg-dark-700 rounded-lg p-2
                                            text-center">
                              <div className="flex items-center
                                              justify-center gap-1 mb-1">
                                <Users
                                  size={11}
                                  className="text-dark-400"
                                />
                              </div>
                              <p className="text-white text-sm font-bold">
                                {business._count?.businessUsers || 0}
                              </p>
                              <p className="text-dark-500 text-xs">
                                Team
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}