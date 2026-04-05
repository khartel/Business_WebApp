import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehouseService } from "../services/warehouse.service";
import { productService } from "../services/product.service";
import { useAuth } from "../context/AuthContext";
import {
  Warehouse,
  ArrowLeft,
  Star,
  MapPin,
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";

export default function WarehouseDetail() {
  const { businessId, warehouseId } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockForm, setStockForm] = useState({
    productId: "",
    quantity: "",
    lowStockThreshold: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const canManage = isSuperAdmin || isAdmin;

  // ─────────────────────────────────────────
  // FETCH WAREHOUSE
  // ─────────────────────────────────────────
  const { data: warehouseData, isLoading } = useQuery({
    queryKey: ["warehouse", businessId, warehouseId],
    queryFn: () => warehouseService.getOne(businessId, warehouseId),
  });

  // ─────────────────────────────────────────
  // FETCH ALL PRODUCTS (for add stock dropdown)
  // ─────────────────────────────────────────
  const { data: productsData } = useQuery({
    queryKey: ["products", businessId],
    queryFn: () => productService.getAll(businessId),
  });

  const warehouse = warehouseData?.data;
  const allProducts = productsData?.data || [];
  const stockItems = warehouse?.stock || [];

  // Products not yet in this warehouse
  const productsNotInWarehouse = allProducts.filter(
    (p) => !stockItems.find((s) => s.productId === p.id)
  );

  // All products for add stock (both existing and new)
  const productOptions = allProducts.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  // ─────────────────────────────────────────
  // ADD STOCK MUTATION
  // ─────────────────────────────────────────
  const addStockMutation = useMutation({
    mutationFn: (data) =>
      productService.addStock(businessId, data.productId, {
        warehouseId,
        quantity: data.quantity,
        lowStockThreshold: data.lowStockThreshold,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["warehouse", businessId, warehouseId]);
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
  // SET PRIMARY
  // ─────────────────────────────────────────
  const setPrimaryMutation = useMutation({
    mutationFn: () =>
      warehouseService.setPrimary(businessId, warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries(["warehouse", businessId, warehouseId]);
      queryClient.invalidateQueries(["warehouses", businessId]);
    },
  });

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────
  const resetStockForm = () => {
    setStockForm({ productId: "", quantity: "", lowStockThreshold: "" });
    setErrors({});
    setApiError("");
    setSelectedProduct(null);
  };

  const validateStock = () => {
    const newErrors = {};
    if (!stockForm.productId)
      newErrors.productId = "Product is required";
    if (!stockForm.quantity)
      newErrors.quantity = "Quantity is required";
    if (parseFloat(stockForm.quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0";
    return newErrors;
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateStock();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    addStockMutation.mutate({
      productId: stockForm.productId,
      quantity: parseFloat(stockForm.quantity),
      lowStockThreshold: stockForm.lowStockThreshold
        ? parseFloat(stockForm.lowStockThreshold)
        : undefined,
    });
  };

  // ─────────────────────────────────────────
  // FILTER STOCK ITEMS
  // ─────────────────────────────────────────
  const filteredStock = stockItems.filter((item) =>
    item.product?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────
  const outOfStock = stockItems.filter((s) => s.quantity === 0).length;
  const lowStock = stockItems.filter(
    (s) => s.quantity > 0 && s.quantity <= s.lowStockThreshold
  ).length;
  const healthy = stockItems.filter(
    (s) => s.quantity > s.lowStockThreshold
  ).length;

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

  if (!warehouse) {
    return (
      <div className="text-center py-16">
        <p className="text-dark-400">Warehouse not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-primary-400 text-sm mt-2 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-dark-400 hover:text-white
                   transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        Back to Warehouses
      </button>

      {/* Warehouse Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center
                          justify-center ${
                            warehouse.isPrimary
                              ? "bg-yellow-500/20"
                              : "bg-dark-700"
                          }`}
            >
              <Warehouse
                size={26}
                className={
                  warehouse.isPrimary
                    ? "text-yellow-400"
                    : "text-dark-400"
                }
              />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">
                  {warehouse.name}
                </h1>
                {warehouse.isPrimary && (
                  <div className="flex items-center gap-1.5 bg-yellow-500/10
                                  border border-yellow-500/20 rounded-full
                                  px-3 py-1">
                    <Star
                      size={12}
                      className="text-yellow-400 fill-yellow-400"
                    />
                    <span className="text-yellow-400 text-xs font-medium">
                      Primary Warehouse
                    </span>
                  </div>
                )}
              </div>
              {warehouse.location && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin size={13} className="text-dark-500" />
                  <span className="text-dark-400 text-sm">
                    {warehouse.location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {!warehouse.isPrimary && canManage && (
              <Button
                variant="secondary"
                onClick={() => setPrimaryMutation.mutate()}
                loading={setPrimaryMutation.isPending}
              >
                <CheckCircle size={16} />
                Set as Primary
              </Button>
            )}
            {canManage && (
              <Button onClick={() => setShowAddStock(true)}>
                <PlusCircle size={16} />
                Add Stock
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-dark-400 text-xs mb-1">Total Products</p>
          <p className="text-white text-2xl font-bold">
            {stockItems.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-dark-400 text-xs mb-1">Healthy</p>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
            <p className="text-green-400 text-2xl font-bold">{healthy}</p>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-dark-400 text-xs mb-1">Low Stock</p>
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-yellow-400" />
            <p className="text-yellow-400 text-2xl font-bold">{lowStock}</p>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-dark-400 text-xs mb-1">Out of Stock</p>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <p className="text-red-400 text-2xl font-bold">{outOfStock}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      {stockItems.length > 0 && (
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
          />
          <input
            type="text"
            placeholder="Search products in this warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
          />
        </div>
      )}

      {/* Stock Table */}
      {stockItems.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-dark-800 rounded-2xl
                          flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-dark-500" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">
            No products in this warehouse
          </h3>
          <p className="text-dark-400 text-sm mb-6">
            Add stock to this warehouse to see products here
          </p>
          {canManage && (
            <Button onClick={() => setShowAddStock(true)}>
              <PlusCircle size={16} />
              Add Stock
            </Button>
          )}
        </div>
      ) : (
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
                    Quantity
                  </th>
                  <th className="text-left text-dark-400 text-xs font-medium
                                 uppercase tracking-wider px-6 py-4">
                    Low Stock Alert
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
                {filteredStock.map((item) => {
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock =
                    !isOutOfStock &&
                    item.quantity <= item.lowStockThreshold;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-dark-800/50 transition-colors"
                    >
                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-600/10
                                          rounded-lg flex items-center
                                          justify-center flex-shrink-0">
                            <Package
                              size={14}
                              className="text-primary-400"
                            />
                          </div>
                          <span className="text-white font-medium">
                            {item.product?.name}
                          </span>
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="px-6 py-4">
                        <span className="text-dark-300 text-sm capitalize">
                          {item.product?.unit}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold text-lg ${
                            isOutOfStock
                              ? "text-red-400"
                              : isLowStock
                              ? "text-yellow-400"
                              : "text-white"
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </td>

                      {/* Low Stock Threshold */}
                      <td className="px-6 py-4">
                        <span className="text-dark-400 text-sm">
                          {item.lowStockThreshold} {item.product?.unit}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="badge-red">Out of Stock</span>
                        ) : isLowStock ? (
                          <div className="flex items-center gap-1.5">
                            <span className="badge-yellow">Low Stock</span>
                            <AlertTriangle
                              size={13}
                              className="text-yellow-400"
                            />
                          </div>
                        ) : (
                          <span className="badge-green">In Stock</span>
                        )}
                      </td>

                      {/* Add More Stock */}
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setStockForm({
                                productId: item.productId,
                                quantity: "",
                                lowStockThreshold:
                                  item.lowStockThreshold?.toString() ||
                                  "",
                              });
                              setSelectedProduct(item.product);
                              setShowAddStock(true);
                            }}
                            className="flex items-center gap-1.5 text-primary-400
                                       hover:text-primary-300 text-sm
                                       transition-colors ml-auto"
                          >
                            <PlusCircle size={15} />
                            Add Stock
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredStock.length === 0 && search && (
            <div className="p-8 text-center">
              <p className="text-dark-400">
                No products found for "{search}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Stock Modal */}
      <Modal
        isOpen={showAddStock}
        onClose={() => {
          setShowAddStock(false);
          resetStockForm();
        }}
        title={
          selectedProduct
            ? `Add Stock — ${selectedProduct.name}`
            : "Add Stock to Warehouse"
        }
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20
                            rounded-lg p-3">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          {/* Product Select (only if not pre-selected) */}
          {!selectedProduct && (
            <Select
              label="Product"
              value={stockForm.productId}
              onChange={(e) => {
                setStockForm({ ...stockForm, productId: e.target.value });
                setErrors({ ...errors, productId: "" });
              }}
              options={productOptions}
              placeholder="Select a product"
              error={errors.productId}
            />
          )}

          {/* If pre-selected show product info */}
          {selectedProduct && (
            <div className="bg-dark-800 rounded-lg p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-600/10 rounded-lg
                              flex items-center justify-center">
                <Package size={16} className="text-primary-400" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {selectedProduct.name}
                </p>
                <p className="text-dark-400 text-xs">
                  Unit: {selectedProduct.unit}
                </p>
              </div>
            </div>
          )}

          <Input
            label={`Quantity to Add (${
              selectedProduct?.unit ||
              allProducts.find((p) => p.id === stockForm.productId)
                ?.unit ||
              "units"
            })`}
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