import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { stockService } from "../services/stock.service";
import { warehouseService } from "../services/warehouse.service";
import { productService } from "../services/product.service";
import { useAuth } from "../context/AuthContext";
import {
  MoveRight,
  Plus,
  Trash2,
  Warehouse,
  Package,
  ArrowRight,
  Calendar,
  User,
  Search,
  StickyNote,
  ChevronRight,
  Minus,
  AlertTriangle,
} from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";

export default function StockMovement() {
  const { businessId } = useParams();
  const { isSuperAdmin, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [showMove, setShowMove] = useState(false);
  const [apiError, setApiError] = useState("");
  const [searchProduct, setSearchProduct] = useState("");

  // Warehouse selection
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [globalNotes, setGlobalNotes] = useState("");
  const [errors, setErrors] = useState({});

  // Search inside modal
  const [modalSearch, setModalSearch] = useState("");

  // Selected items to move (cart style)
  const [moveItems, setMoveItems] = useState([]);

  const [isMoving, setIsMoving] = useState(false);

  const canManage = isSuperAdmin || isAdmin;

  // ─────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ["stock-movements", businessId],
    queryFn: () => stockService.getMovements(businessId),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses", businessId],
    queryFn: () => warehouseService.getAll(businessId),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", businessId],
    queryFn: () => productService.getAll(businessId),
  });

  const movements = movementsData?.data || [];
  const warehouses = warehousesData?.data || [];
  const products = productsData?.data || [];

  // ─────────────────────────────────────────
  // OPTIONS
  // ─────────────────────────────────────────
  const warehouseOptions = warehouses.map((w) => ({
    value: w.id,
    label: `${w.name} ${w.isPrimary ? "(Primary)" : ""}`,
  }));

  // Get available stock for a product in the fromWarehouse
  const getAvailableStock = (productId) => {
    if (!fromWarehouseId) return null;
    const product = products.find((p) => p.id === productId);
    return product?.stock?.find((s) => s.warehouseId === fromWarehouseId);
  };

  // ─────────────────────────────────────────
  // MODAL PRODUCT SEARCH RESULTS
  // ─────────────────────────────────────────
  const filteredModalProducts = products.filter((p) => {
    if (!modalSearch) return false;
    const alreadyAdded = moveItems.find((i) => i.productId === p.id);
    return (
      !alreadyAdded &&
      p.name.toLowerCase().includes(modalSearch.toLowerCase())
    );
  });

  // ─────────────────────────────────────────
  // ADD PRODUCT TO MOVE LIST
  // ─────────────────────────────────────────
  const addToMoveList = (product) => {
    const available = getAvailableStock(product.id);
    setMoveItems([
      ...moveItems,
      {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        quantity: 1,
        availableStock: available?.quantity || 0,
      },
    ]);
    setModalSearch("");
  };

  const removeFromMoveList = (productId) => {
    setMoveItems(moveItems.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId, value) => {
    setMoveItems(
      moveItems.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(1, parseFloat(value) || 1),
            }
          : item
      )
    );
  };

  // ─────────────────────────────────────────
  // MOVE STOCK
  // ─────────────────────────────────────────
  const handleMultiMove = async () => {
    setApiError("");
    const newErrors = {};

    if (!fromWarehouseId)
      newErrors.fromWarehouseId = "Source warehouse is required";
    if (!toWarehouseId)
      newErrors.toWarehouseId = "Destination warehouse is required";
    if (fromWarehouseId === toWarehouseId)
      newErrors.toWarehouseId = "Cannot be the same warehouse";
    if (moveItems.length === 0)
      newErrors.items = "Add at least one product to move";

    // Check quantities
    moveItems.forEach((item) => {
      if (item.quantity > item.availableStock) {
        newErrors[`qty_${item.productId}`] =
          `Only ${item.availableStock} ${item.unit} available`;
      }
      if (item.availableStock === 0) {
        newErrors[`qty_${item.productId}`] =
          "No stock available in source warehouse";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsMoving(true);
    try {
      for (const item of moveItems) {
        await stockService.move(businessId, {
          fromWarehouseId,
          toWarehouseId,
          productId: item.productId,
          quantity: item.quantity,
          notes: globalNotes || undefined,
        });
      }

      queryClient.invalidateQueries(["stock-movements", businessId]);
      queryClient.invalidateQueries(["products", businessId]);
      queryClient.invalidateQueries(["warehouses", businessId]);
      setShowMove(false);
      resetForm();
    } catch (error) {
      setApiError(
        error.response?.data?.message || "Could not move stock"
      );
    } finally {
      setIsMoving(false);
    }
  };

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────
  const resetForm = () => {
    setFromWarehouseId("");
    setToWarehouseId("");
    setGlobalNotes("");
    setMoveItems([]);
    setModalSearch("");
    setErrors({});
    setApiError("");
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredMovements = movements.filter((m) => {
    if (!searchProduct) return true;
    return m.product?.name
      ?.toLowerCase()
      .includes(searchProduct.toLowerCase());
  });

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
        title="Stock Movement"
        description="Move stock between warehouses and view history"
        action={
          canManage && (
            <Button onClick={() => setShowMove(true)}>
              <Plus size={18} />
              Move Stock
            </Button>
          )
        }
      />

      {/* Current Stock Overview */}
      {warehouses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3
                        gap-4 mb-6">
          {warehouses.map((warehouse) => (
            <div key={warehouse.id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center
                              justify-center ${
                                warehouse.isPrimary
                                  ? "bg-yellow-500/20"
                                  : "bg-dark-700"
                              }`}
                >
                  <Warehouse
                    size={16}
                    className={
                      warehouse.isPrimary
                        ? "text-yellow-400"
                        : "text-dark-400"
                    }
                  />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    {warehouse.name}
                  </p>
                  {warehouse.isPrimary && (
                    <p className="text-yellow-400 text-xs">
                      Primary Warehouse
                    </p>
                  )}
                </div>
              </div>

              {warehouse.stock?.length > 0 ? (
                <div className="space-y-1.5">
                  {warehouse.stock.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between
                                 text-sm py-1 border-b border-dark-800
                                 last:border-0"
                    >
                      <span className="text-dark-300 truncate">
                        {item.product?.name}
                      </span>
                      <span
                        className={`font-medium ml-2 flex-shrink-0 ${
                          item.quantity <= item.lowStockThreshold
                            ? "text-yellow-400"
                            : "text-white"
                        }`}
                      >
                        {item.quantity}{" "}
                        <span className="text-dark-500 font-normal">
                          {item.product?.unit}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-500 text-sm text-center py-2">
                  No stock in this warehouse
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search History */}
      {movements.length > 0 && (
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
          />
          <input
            type="text"
            placeholder="Search movement history by product..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="input-base pl-10"
          />
        </div>
      )}

      {/* Movement History */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <h3 className="text-white font-semibold">Movement History</h3>
        </div>

        {movements.length === 0 && (
          <div className="p-12">
            <EmptyState
              icon={MoveRight}
              title="No stock movements yet"
              description="Move stock between warehouses to see the history here"
              action={
                canManage && (
                  <Button onClick={() => setShowMove(true)}>
                    <Plus size={18} />
                    Move Stock
                  </Button>
                )
              }
            />
          </div>
        )}

        {filteredMovements.length > 0 && (
          <div className="divide-y divide-dark-800">
            {filteredMovements.map((movement) => (
              <div key={movement.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary-600/10 rounded-xl
                                    flex items-center justify-center
                                    flex-shrink-0 mt-0.5">
                      <Package size={18} className="text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium">
                          {movement.product?.name}
                        </p>
                        <span className="badge-blue">
                          {movement.quantity} {movement.product?.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5
                                      flex-wrap">
                        <div className="flex items-center gap-1.5
                                        bg-dark-800 rounded-lg px-2 py-1">
                          <Warehouse size={12} className="text-dark-400" />
                          <span className="text-dark-300 text-xs">
                            {movement.fromWarehouse?.name}
                          </span>
                        </div>
                        <ArrowRight size={14} className="text-dark-500" />
                        <div className="flex items-center gap-1.5
                                        bg-dark-800 rounded-lg px-2 py-1">
                          <Warehouse
                            size={12}
                            className="text-primary-400"
                          />
                          <span className="text-primary-300 text-xs">
                            {movement.toWarehouse?.name}
                          </span>
                        </div>
                      </div>

                      {movement.notes && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <StickyNote
                            size={11}
                            className="text-dark-500"
                          />
                          <span className="text-dark-400 text-xs">
                            {movement.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 justify-end mb-1">
                      <User size={12} className="text-dark-500" />
                      <span className="text-dark-400 text-xs">
                        {movement.movedBy?.fullName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Calendar size={12} className="text-dark-500" />
                      <span className="text-dark-500 text-xs">
                        {formatDate(movement.createdAt)}{" "}
                        {formatTime(movement.createdAt)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span
                        className={
                          movement.status === "COMPLETED"
                            ? "badge-green"
                            : movement.status === "PENDING"
                            ? "badge-yellow"
                            : "badge-red"
                        }
                      >
                        {movement.status.charAt(0) +
                          movement.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {movements.length > 0 && filteredMovements.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-dark-400">
              No movements found for "{searchProduct}"
            </p>
          </div>
        )}
      </div>

      {/* Move Stock Modal */}
      <Modal
        isOpen={showMove}
        onClose={() => {
          setShowMove(false);
          resetForm();
        }}
        title="Move Stock Between Warehouses"
        size="lg"
      >
        <div className="space-y-4">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20
                            rounded-lg p-3">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          {/* From / To Warehouses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="From Warehouse"
              value={fromWarehouseId}
              onChange={(e) => {
                setFromWarehouseId(e.target.value);
                setMoveItems([]);
                setModalSearch("");
                setErrors({ ...errors, fromWarehouseId: "" });
              }}
              options={warehouseOptions}
              placeholder="Select source warehouse"
              error={errors.fromWarehouseId}
            />

            <Select
              label="To Warehouse"
              value={toWarehouseId}
              onChange={(e) => {
                setToWarehouseId(e.target.value);
                setErrors({ ...errors, toWarehouseId: "" });
              }}
              options={warehouseOptions.filter(
                (w) => w.value !== fromWarehouseId
              )}
              placeholder="Select destination warehouse"
              error={errors.toWarehouseId}
            />
          </div>

          {/* Route Preview */}
          {fromWarehouseId && toWarehouseId && (
            <div className="bg-primary-500/10 border border-primary-500/20
                            rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1 text-center">
                <p className="text-dark-400 text-xs">From</p>
                <p className="text-white font-medium text-sm">
                  {warehouses.find((w) => w.id === fromWarehouseId)?.name}
                </p>
              </div>
              <ArrowRight
                size={20}
                className="text-primary-400 flex-shrink-0"
              />
              <div className="flex-1 text-center">
                <p className="text-dark-400 text-xs">To</p>
                <p className="text-white font-medium text-sm">
                  {warehouses.find((w) => w.id === toWarehouseId)?.name}
                </p>
              </div>
            </div>
          )}

          {/* Product Search */}
          <div className="card p-4">
            <p className="text-white font-medium mb-3">
              Search Products to Move
            </p>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2
                           text-dark-400"
              />
              <input
                type="text"
                placeholder={
                  !fromWarehouseId
                    ? "Select a source warehouse first..."
                    : "Type product name to search..."
                }
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                disabled={!fromWarehouseId}
                className="input-base pl-10 disabled:opacity-50
                           disabled:cursor-not-allowed"
              />
            </div>

            {/* Search Results */}
            {modalSearch && (
              <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
                {filteredModalProducts.length === 0 && (
                  <p className="text-dark-400 text-sm text-center py-4">
                    No products found
                  </p>
                )}
                {filteredModalProducts.map((product) => {
                  const available = getAvailableStock(product.id);
                  const hasStock =
                    available && available.quantity > 0;

                  return (
                    <button
                      key={product.id}
                      onClick={() =>
                        hasStock && addToMoveList(product)
                      }
                      disabled={!hasStock}
                      className={`w-full flex items-center justify-between
                                  p-3 rounded-lg transition-colors text-left
                                  ${
                                    !hasStock
                                      ? "opacity-50 cursor-not-allowed bg-dark-800"
                                      : "bg-dark-800 hover:bg-dark-700 cursor-pointer"
                                  }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-600/10
                                        rounded-lg flex items-center
                                        justify-center">
                          <Package
                            size={14}
                            className="text-primary-400"
                          />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="text-dark-400 text-xs">
                            {available
                              ? `${available.quantity} ${product.unit} in source warehouse`
                              : "Not stocked in source warehouse"}
                          </p>
                        </div>
                      </div>

                      {!hasStock ? (
                        <span className="badge-red text-xs">
                          No Stock
                        </span>
                      ) : (
                        <ChevronRight
                          size={16}
                          className="text-dark-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error for empty items */}
          {errors.items && (
            <p className="text-red-400 text-sm">{errors.items}</p>
          )}

          {/* Selected Items */}
          {moveItems.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-3 border-b border-dark-700 flex items-center
                              justify-between">
                <p className="text-white font-medium text-sm">
                  Products to Move ({moveItems.length})
                </p>
                <button
                  onClick={() => setMoveItems([])}
                  className="text-dark-500 hover:text-red-400
                             text-xs transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="divide-y divide-dark-800">
                {moveItems.map((item) => {
                  const isOver = item.quantity > item.availableStock;
                  const hasError = errors[`qty_${item.productId}`];

                  return (
                    <div key={item.productId} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {item.productName}
                          </p>
                          <p className="text-dark-400 text-xs">
                            Available: {item.availableStock} {item.unit}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            removeFromMoveList(item.productId)
                          }
                          className="text-dark-500 hover:text-red-400
                                     transition-colors p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 bg-dark-700 hover:bg-dark-600
                                     rounded-lg flex items-center justify-center
                                     text-white disabled:opacity-50
                                     transition-colors flex-shrink-0"
                        >
                          <Minus size={14} />
                        </button>

                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.productId,
                              e.target.value
                            )
                          }
                          min="1"
                          className={`input-base text-center py-2 ${
                            isOver ? "border-red-500" : ""
                          }`}
                        />

                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          className="w-8 h-8 bg-dark-700 hover:bg-dark-600
                                     rounded-lg flex items-center justify-center
                                     text-white transition-colors flex-shrink-0"
                        >
                          <Plus size={14} />
                        </button>

                        <span className="text-dark-400 text-sm flex-shrink-0">
                          {item.unit}
                        </span>
                      </div>

                      {/* Over stock warning */}
                      {(isOver || hasError) && (
                        <p className="text-red-400 text-xs mt-1.5
                                      flex items-center gap-1">
                          <AlertTriangle size={11} />
                          {hasError ||
                            `Exceeds available stock (${item.availableStock} ${item.unit})`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-dark-300">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Reason for moving stock..."
              value={globalNotes}
              onChange={(e) => setGlobalNotes(e.target.value)}
              rows={2}
              className="input-base resize-none"
            />
          </div>

          {/* Summary */}
          {moveItems.length > 0 &&
            fromWarehouseId &&
            toWarehouseId && (
              <div className="bg-dark-800 rounded-lg p-3">
                <p className="text-dark-400 text-xs font-medium mb-2 uppercase tracking-wider">
                  Movement Summary
                </p>
                <div className="space-y-1">
                  {moveItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-dark-300">
                        {item.productName}
                      </span>
                      <span className="text-white font-medium">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowMove(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={isMoving}
              onClick={handleMultiMove}
              disabled={moveItems.length === 0}
            >
              <MoveRight size={18} />
              Move Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}