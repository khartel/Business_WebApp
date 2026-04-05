import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "../services/product.service";
import { warehouseService } from "../services/warehouse.service";
import { useAuth } from "../context/AuthContext";
import {
  Package,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  Warehouse,
  Search,
  PlusCircle,
  Tag,
} from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";

export default function Products() {
  const { businessId } = useParams();
  const { isSuperAdmin, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [search, setSearch] = useState("");
  const [apiError, setApiError] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    unit: "",
    price: "",
    description: "",
  });

  const [stockForm, setStockForm] = useState({
    warehouseId: "",
    quantity: "",
    lowStockThreshold: "",
  });

  const [errors, setErrors] = useState({});

  const canManage = isSuperAdmin || isAdmin;

  // Get active business for currency
  const activeBusiness = localStorage.getItem("activeBusiness")
    ? JSON.parse(localStorage.getItem("activeBusiness"))
    : null;
  const currency = activeBusiness?.currency || "";

  // ─────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", businessId],
    queryFn: () => productService.getAll(businessId),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses", businessId],
    queryFn: () => warehouseService.getAll(businessId),
  });

  const products = productsData?.data || [];
  const warehouses = warehousesData?.data || [];

  const warehouseOptions = warehouses.map((w) => ({
    value: w.id,
    label: `${w.name} ${w.isPrimary ? "(Primary)" : ""}`,
  }));

  const unitOptions = [
    { value: "pieces", label: "Pieces" },
    { value: "bags", label: "Bags" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "litres", label: "Litres" },
    { value: "cartons", label: "Cartons" },
    { value: "bottles", label: "Bottles" },
    { value: "packs", label: "Packs" },
    { value: "tonnes", label: "Tonnes" },
    { value: "meters", label: "Meters" },
    { value: "dozen", label: "Dozen" },
  ];

  // ─────────────────────────────────────────
  // FILTER
  // ─────────────────────────────────────────
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────
  // FORMAT
  // ─────────────────────────────────────────
  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  // ─────────────────────────────────────────
  // CREATE PRODUCT
  // ─────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => productService.create(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["products", businessId]);
      setShowCreate(false);
      resetProductForm();
    },
    onError: (error) => {
      setApiError(
        error.response?.data?.message || "Could not create product"
      );
    },
  });

  // ─────────────────────────────────────────
  // UPDATE PRODUCT
  // ─────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data) =>
      productService.update(businessId, selectedProduct.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["products", businessId]);
      setShowEdit(false);
      resetProductForm();
    },
    onError: (error) => {
      setApiError(
        error.response?.data?.message || "Could not update product"
      );
    },
  });

  // ─────────────────────────────────────────
  // DELETE PRODUCT
  // ─────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (productId) => productService.remove(businessId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries(["products", businessId]);
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Could not delete product");
    },
  });

  // ─────────────────────────────────────────
  // ADD STOCK
  // ─────────────────────────────────────────
  const addStockMutation = useMutation({
    mutationFn: (data) =>
      productService.addStock(businessId, selectedProduct.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["products", businessId]);
      setShowAddStock(false);
      resetStockForm();
    },
    onError: (error) => {
      setApiError(
        error.response?.data?.message || "Could not add stock"
      );
    },
  });

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────
  const resetProductForm = () => {
    setProductForm({ name: "", unit: "", price: "", description: "" });
    setErrors({});
    setApiError("");
    setSelectedProduct(null);
  };

  const resetStockForm = () => {
    setStockForm({ warehouseId: "", quantity: "", lowStockThreshold: "" });
    setErrors({});
    setApiError("");
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      unit: product.unit,
      price: product.price?.toString() || "",
      description: product.description || "",
    });
    setShowEdit(true);
    setOpenMenu(null);
  };

  const handleAddStock = (product) => {
    setSelectedProduct(product);
    setShowAddStock(true);
    setOpenMenu(null);
  };

  const validateProduct = () => {
    const newErrors = {};
    if (!productForm.name.trim())
      newErrors.name = "Product name is required";
    if (!productForm.unit)
      newErrors.unit = "Unit is required";
    if (!productForm.price || parseFloat(productForm.price) < 0)
      newErrors.price = "Valid price is required";
    return newErrors;
  };

  const validateStock = () => {
    const newErrors = {};
    if (!stockForm.warehouseId)
      newErrors.warehouseId = "Warehouse is required";
    if (!stockForm.quantity)
      newErrors.quantity = "Quantity is required";
    if (parseFloat(stockForm.quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0";
    return newErrors;
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateProduct();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (showEdit) {
      updateMutation.mutate(productForm);
    } else {
      createMutation.mutate(productForm);
    }
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateStock();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    addStockMutation.mutate({
      warehouseId: stockForm.warehouseId,
      quantity: parseFloat(stockForm.quantity),
      lowStockThreshold: stockForm.lowStockThreshold
        ? parseFloat(stockForm.lowStockThreshold)
        : undefined,
    });
  };

  // ─────────────────────────────────────────
  // STOCK STATUS
  // ─────────────────────────────────────────
  const getStockStatus = (product) => {
    if (product.totalQuantity === 0)
      return { label: "Out of Stock", class: "badge-red" };
    const ps = product.primaryStock;
    if (ps && ps.quantity <= ps.lowStockThreshold)
      return { label: "Low Stock", class: "badge-yellow" };
    return { label: "In Stock", class: "badge-green" };
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
        title="Products"
        description="Manage your business products and inventory"
        action={
          canManage && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={18} />
              Add Product
            </Button>
          )
        }
      />

      {/* Stats Row */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">Total Products</p>
            <p className="text-white text-2xl font-bold">
              {products.length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">In Stock</p>
            <p className="text-green-400 text-2xl font-bold">
              {products.filter((p) => p.totalQuantity > 0).length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">Low Stock</p>
            <p className="text-yellow-400 text-2xl font-bold">
              {
                products.filter((p) => {
                  const ps = p.primaryStock;
                  return (
                    ps &&
                    ps.quantity > 0 &&
                    ps.quantity <= ps.lowStockThreshold
                  );
                }).length
              }
            </p>
          </div>
          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">Out of Stock</p>
            <p className="text-red-400 text-2xl font-bold">
              {products.filter((p) => p.totalQuantity === 0).length}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      {products.length > 0 && (
        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
          />
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start tracking inventory"
          action={
            canManage && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={18} />
                Add Product
              </Button>
            )
          }
        />
      )}

      {/* Products Table */}
      {filteredProducts.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left text-dark-400 text-xs font-medium
                                 uppercase tracking-wider px-6 py-4">
                    Product
                  </th>
                  <th className="text-left text-dark-400 text-xs font-medium
                                 uppercase tracking-wider px-6 py-4">
                    Unit
                  </th>
                  <th className="text-left text-dark-400 text-xs font-medium
                                 uppercase tracking-wider px-6 py-4">
                    Price
                  </th>
                  <th className="text-left text-dark-400 text-xs font-medium
                                 uppercase tracking-wider px-6 py-4">
                    Primary Stock
                  </th>
                  <th className="text-left text-dark-400 text-xs font-medium
                                 uppercase tracking-wider px-6 py-4">
                    Total Stock
                  </th>
                  <th className="text-left text-dark-400 text-xs font-medium
                                 uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  {canManage && (
                    <th className="text-right text-dark-400 text-xs font-medium
                                   uppercase tracking-wider px-6 py-4">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-dark-800/50 transition-colors"
                    >
                      {/* Product Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-600/10
                                          rounded-lg flex items-center
                                          justify-center flex-shrink-0">
                            <Package
                              size={16}
                              className="text-primary-400"
                            />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {product.name}
                            </p>
                            {product.description && (
                              <p className="text-dark-400 text-xs mt-0.5">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="px-6 py-4">
                        <span className="text-dark-300 text-sm capitalize">
                          {product.unit}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Tag size={13} className="text-primary-400" />
                          <span className="text-white font-semibold">
                            {currency} {formatAmount(product.price)}
                          </span>
                        </div>
                      </td>

                      {/* Primary Stock */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Warehouse size={14} className="text-dark-500" />
                          <span
                            className={`font-medium ${
                              product.primaryStock &&
                              product.primaryStock.quantity <=
                                product.primaryStock.lowStockThreshold
                                ? "text-yellow-400"
                                : "text-white"
                            }`}
                          >
                            {product.primaryStock
                              ? product.primaryStock.quantity
                              : 0}
                          </span>
                          <span className="text-dark-500 text-xs">
                            {product.unit}
                          </span>
                          {product.primaryStock &&
                            product.primaryStock.quantity <=
                              product.primaryStock.lowStockThreshold &&
                            product.primaryStock.quantity > 0 && (
                              <AlertTriangle
                                size={14}
                                className="text-yellow-400"
                              />
                            )}
                        </div>
                      </td>

                      {/* Total Stock */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-white font-medium">
                            {product.totalQuantity}
                          </span>
                          <span className="text-dark-500 text-xs">
                            {product.unit}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={status.class}>
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === product.id
                                    ? null
                                    : product.id
                                )
                              }
                              className="text-dark-400 hover:text-white
                                         p-1.5 transition-colors rounded-lg
                                         hover:bg-dark-700"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {openMenu === product.id && (
                              <div className="absolute right-0 top-8
                                              bg-dark-800 border border-dark-600
                                              rounded-xl shadow-xl z-10
                                              min-w-44 overflow-hidden">
                                <button
                                  onClick={() => handleAddStock(product)}
                                  className="flex items-center gap-2 w-full
                                             px-4 py-2.5 text-sm text-dark-300
                                             hover:text-white hover:bg-dark-700
                                             transition-colors"
                                >
                                  <PlusCircle size={15} />
                                  Add Stock
                                </button>
                                <button
                                  onClick={() =>
                                    handleEditProduct(product)
                                  }
                                  className="flex items-center gap-2 w-full
                                             px-4 py-2.5 text-sm text-dark-300
                                             hover:text-white hover:bg-dark-700
                                             transition-colors"
                                >
                                  <Edit size={15} />
                                  Edit Product
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Delete this product? This cannot be undone."
                                      )
                                    ) {
                                      deleteMutation.mutate(product.id);
                                    }
                                    setOpenMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full
                                             px-4 py-2.5 text-sm text-red-400
                                             hover:text-red-300
                                             hover:bg-red-500/10
                                             transition-colors"
                                >
                                  <Trash2 size={15} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No search results */}
      {products.length > 0 && filteredProducts.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-dark-400">
            No products found for "{search}"
          </p>
        </div>
      )}

      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={showCreate || showEdit}
        onClose={() => {
          setShowCreate(false);
          setShowEdit(false);
          resetProductForm();
        }}
        title={showEdit ? "Edit Product" : "Add Product"}
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20
                            rounded-lg p-3">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          <Input
            label="Product Name"
            placeholder="e.g. Rice, Sugar, Cement"
            value={productForm.name}
            onChange={(e) => {
              setProductForm({ ...productForm, name: e.target.value });
              setErrors({ ...errors, name: "" });
            }}
            error={errors.name}
          />

          <Select
            label="Unit of Measurement"
            value={productForm.unit}
            onChange={(e) => {
              setProductForm({ ...productForm, unit: e.target.value });
              setErrors({ ...errors, unit: "" });
            }}
            options={unitOptions}
            placeholder="Select unit"
            error={errors.unit}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-dark-300">
              Selling Price ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2
                               text-dark-400 text-sm font-medium">
                {currency}
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={productForm.price}
                onChange={(e) => {
                  setProductForm({
                    ...productForm,
                    price: e.target.value,
                  });
                  setErrors({ ...errors, price: "" });
                }}
                min="0"
                step="0.01"
                className={`input-base pl-12 ${
                  errors.price ? "border-red-500" : ""
                }`}
              />
            </div>
            {errors.price && (
              <p className="text-red-400 text-xs">{errors.price}</p>
            )}
            <p className="text-dark-500 text-xs">
              This price auto-fills when making a sale. Can be adjusted per transaction.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-dark-300">
              Description (Optional)
            </label>
            <textarea
              placeholder="Brief description of the product"
              value={productForm.description}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  description: e.target.value,
                })
              }
              rows={3}
              className="input-base resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowCreate(false);
                setShowEdit(false);
                resetProductForm();
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
              {showEdit ? "Save Changes" : "Add Product"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Stock Modal */}
      <Modal
        isOpen={showAddStock}
        onClose={() => {
          setShowAddStock(false);
          resetStockForm();
        }}
        title={`Add Stock — ${selectedProduct?.name}`}
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20
                            rounded-lg p-3">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          <Select
            label="Warehouse"
            value={stockForm.warehouseId}
            onChange={(e) => {
              setStockForm({ ...stockForm, warehouseId: e.target.value });
              setErrors({ ...errors, warehouseId: "" });
            }}
            options={warehouseOptions}
            placeholder="Select warehouse"
            error={errors.warehouseId}
          />

          <Input
            label={`Quantity (${selectedProduct?.unit || "units"})`}
            type="number"
            placeholder="Enter quantity"
            value={stockForm.quantity}
            onChange={(e) => {
              setStockForm({ ...stockForm, quantity: e.target.value });
              setErrors({ ...errors, quantity: "" });
            }}
            error={errors.quantity}
            min="0"
          />

          <Input
            label="Low Stock Alert Threshold (Optional)"
            type="number"
            placeholder="e.g. 10 — alert when stock falls below this"
            value={stockForm.lowStockThreshold}
            onChange={(e) =>
              setStockForm({
                ...stockForm,
                lowStockThreshold: e.target.value,
              })
            }
            min="0"
          />

          {/* Current stock preview */}
          {selectedProduct?.stock?.length > 0 && (
            <div className="bg-dark-800 rounded-lg p-4">
              <p className="text-dark-400 text-xs font-medium mb-3
                            uppercase tracking-wider">
                Current Stock
              </p>
              <div className="space-y-2">
                {selectedProduct.stock.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Warehouse size={13} className="text-dark-500" />
                      <span className="text-dark-300 text-sm">
                        {s.warehouse.name}
                        {s.warehouse.isPrimary && (
                          <span className="text-yellow-400 text-xs ml-1">
                            (Primary)
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-white font-medium text-sm">
                      {s.quantity} {selectedProduct.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddStock(false);
                resetStockForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={addStockMutation.isPending}
            >
              Add Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}