import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehouseService } from "../services/warehouse.service";
import { useAuth } from "../context/AuthContext";
import {
  Warehouse,
  Plus,
  Star,
  MapPin,
  Package,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";

export default function Warehouses() {
  const { businessId } = useParams();
  const { isSuperAdmin, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    isPrimary: false,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const canManage = isSuperAdmin || isAdmin;

  // ─────────────────────────────────────────
  // FETCH WAREHOUSES
  // ─────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["warehouses", businessId],
    queryFn: () => warehouseService.getAll(businessId),
  });

  const warehouses = data?.data || [];

  // ─────────────────────────────────────────
  // CREATE WAREHOUSE
  // ─────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => warehouseService.create(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["warehouses", businessId]);
      setShowCreate(false);
      resetForm();
    },
    onError: (error) => {
      setApiError(
        error.response?.data?.message || "Could not create warehouse"
      );
    },
  });

  // ─────────────────────────────────────────
  // UPDATE WAREHOUSE
  // ─────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data) =>
      warehouseService.update(businessId, selectedWarehouse.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["warehouses", businessId]);
      setShowEdit(false);
      resetForm();
    },
    onError: (error) => {
      setApiError(
        error.response?.data?.message || "Could not update warehouse"
      );
    },
  });

  // ─────────────────────────────────────────
  // SET PRIMARY
  // ─────────────────────────────────────────
  const setPrimaryMutation = useMutation({
    mutationFn: (warehouseId) =>
      warehouseService.setPrimary(businessId, warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries(["warehouses", businessId]);
    },
  });

  // ─────────────────────────────────────────
  // DELETE WAREHOUSE
  // ─────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (warehouseId) =>
      warehouseService.remove(businessId, warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries(["warehouses", businessId]);
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Could not delete warehouse");
    },
  });

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────
  const resetForm = () => {
    setForm({ name: "", location: "", isPrimary: false });
    setErrors({});
    setApiError("");
    setSelectedWarehouse(null);
  };

  const handleEdit = (warehouse, e) => {
    e.stopPropagation();
    setSelectedWarehouse(warehouse);
    setForm({
      name: warehouse.name,
      location: warehouse.location || "",
      isPrimary: warehouse.isPrimary,
    });
    setShowEdit(true);
    setOpenMenu(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Warehouse name is required";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (showEdit) {
      updateMutation.mutate({ name: form.name, location: form.location });
    } else {
      createMutation.mutate(form);
    }
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600
                        border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="Click on a warehouse to view its stock"
        action={
          canManage && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={18} />
              Add Warehouse
            </Button>
          )
        }
      />

      {/* Empty State */}
      {warehouses.length === 0 && (
        <EmptyState
          icon={Warehouse}
          title="No warehouses yet"
          description="Add your first warehouse to start tracking inventory"
          action={
            canManage && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={18} />
                Add Warehouse
              </Button>
            )
          }
        />
      )}

      {/* Warehouses Grid */}
      {warehouses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              onClick={() =>
                navigate(
                  `/businesses/${businessId}/warehouses/${warehouse.id}`
                )
              }
              className="card p-6 cursor-pointer hover:border-primary-500/50
                         transition-all duration-200 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center
                                justify-center transition-colors ${
                                  warehouse.isPrimary
                                    ? "bg-yellow-500/20"
                                    : "bg-dark-700 group-hover:bg-dark-600"
                                }`}
                  >
                    <Warehouse
                      size={18}
                      className={
                        warehouse.isPrimary
                          ? "text-yellow-400"
                          : "text-dark-400"
                      }
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold group-hover:text-primary-300 transition-colors">
                      {warehouse.name}
                    </h3>
                    {warehouse.isPrimary && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star
                          size={10}
                          className="text-yellow-400 fill-yellow-400"
                        />
                        <span className="text-yellow-400 text-xs">
                          Primary
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Menu */}
                {canManage && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(
                          openMenu === warehouse.id ? null : warehouse.id
                        );
                      }}
                      className="text-dark-400 hover:text-white p-1
                                 transition-colors rounded-lg hover:bg-dark-700"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenu === warehouse.id && (
                      <div
                        className="absolute right-0 top-8 bg-dark-800
                                    border border-dark-600 rounded-xl
                                    shadow-xl z-10 min-w-44 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!warehouse.isPrimary && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryMutation.mutate(warehouse.id);
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full
                                       px-4 py-2.5 text-sm text-dark-300
                                       hover:text-white hover:bg-dark-700
                                       transition-colors"
                          >
                            <CheckCircle size={15} />
                            Set as Primary
                          </button>
                        )}
                        <button
                          onClick={(e) => handleEdit(warehouse, e)}
                          className="flex items-center gap-2 w-full
                                     px-4 py-2.5 text-sm text-dark-300
                                     hover:text-white hover:bg-dark-700
                                     transition-colors"
                        >
                          <Edit size={15} />
                          Edit
                        </button>
                        {!warehouse.isPrimary && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  "Delete this warehouse? This cannot be undone."
                                )
                              ) {
                                deleteMutation.mutate(warehouse.id);
                              }
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full
                                       px-4 py-2.5 text-sm text-red-400
                                       hover:text-red-300 hover:bg-red-500/10
                                       transition-colors"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Location */}
              {warehouse.location && (
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={13} className="text-dark-500" />
                  <span className="text-dark-400 text-sm">
                    {warehouse.location}
                  </span>
                </div>
              )}

              {/* Stock Count */}
              <div className="flex items-center justify-between
                              bg-dark-800 rounded-lg p-3 group-hover:bg-dark-700
                              transition-colors">
                <div className="flex items-center gap-2">
                  <Package size={15} className="text-dark-400" />
                  <span className="text-dark-400 text-sm">
                    {warehouse._count?.stock || 0} product
                    {warehouse._count?.stock !== 1 ? "s" : ""} in stock
                  </span>
                </div>
                <ArrowRight
                  size={16}
                  className="text-dark-500 group-hover:text-primary-400
                             transition-colors"
                />
              </div>
            </div>
          ))}

          {/* Add Warehouse Card */}
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
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
                Add Warehouse
              </p>
            </button>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showCreate || showEdit}
        onClose={() => {
          setShowCreate(false);
          setShowEdit(false);
          resetForm();
        }}
        title={showEdit ? "Edit Warehouse" : "Add Warehouse"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20
                            rounded-lg p-3">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          <Input
            label="Warehouse Name"
            name="name"
            placeholder="e.g. Main Warehouse"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setErrors({ ...errors, name: "" });
            }}
            error={errors.name}
          />

          <Input
            label="Location (Optional)"
            name="location"
            placeholder="e.g. Lagos Island"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
          />

          {!showEdit && (
            <div className="flex items-center gap-3 bg-dark-800 rounded-lg p-4">
              <input
                type="checkbox"
                id="isPrimary"
                checked={form.isPrimary}
                onChange={(e) =>
                  setForm({ ...form, isPrimary: e.target.checked })
                }
                className="w-4 h-4 accent-primary-600 cursor-pointer"
              />
              <div>
                <label
                  htmlFor="isPrimary"
                  className="text-white text-sm font-medium cursor-pointer"
                >
                  Set as Primary Warehouse
                </label>
                <p className="text-dark-400 text-xs mt-0.5">
                  Sales will be deducted from this warehouse
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowCreate(false);
                setShowEdit(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={
                createMutation.isPending || updateMutation.isPending
              }
            >
              {showEdit ? "Save Changes" : "Add Warehouse"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}