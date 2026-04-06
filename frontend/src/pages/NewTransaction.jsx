import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { productService } from "../services/product.service";
import { transactionService } from "../services/transaction.service";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle,
  Package,
  AlertTriangle,
  Banknote,
  ArrowLeftRight,
  ChevronRight,
  Printer,
  User,
} from "lucide-react";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";

export default function NewTransaction() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [apiError, setApiError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  const activeBusiness = localStorage.getItem("activeBusiness")
    ? JSON.parse(localStorage.getItem("activeBusiness"))
    : null;

  const currency = activeBusiness?.currency || "";

  // ─────────────────────────────────────────
  // PRINT RECEIPT — Native window.print()
  // ─────────────────────────────────────────
  const printReceipt = () => {
    if (!lastTransaction) return;

    const formatAmount = (amount) =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    const formatTime = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    const itemsHTML = lastTransaction.items
      ?.map(
        (item) => `
          <div style="margin-bottom: 6px;">
            <div style="font-weight: bold;">${item.product?.name}</div>
            <div style="display: flex; justify-content: space-between; padding-left: 8px;">
              <span>${item.quantitySold} ${item.product?.unit} x ${currency} ${formatAmount(item.unitPrice)}</span>
              <span style="font-weight: bold;">${currency} ${formatAmount(item.subtotal)}</span>
            </div>
          </div>
        `
      )
      .join("");

    const notesHTML = lastTransaction.notes
      ? `
          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
          <p style="font-size: 11px; margin: 0;">Note: ${lastTransaction.notes}</p>
        `
      : "";

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt - ${lastTransaction.id?.slice(0, 8).toUpperCase()}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: monospace;
              font-size: 12px;
              color: #000;
              background: #fff;
              width: 80mm;
              padding: 10mm;
            }
            @media print {
              body {
                width: 80mm;
                padding: 10mm;
              }
            }
          </style>
        </head>
        <body>

          <div style="text-align: center; margin-bottom: 8px;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 4px 0;">
              ${activeBusiness?.name || "Business"}
            </h2>
            ${
              activeBusiness?.location
                ? `<p style="margin: 0 0 2px 0; font-size: 11px;">${activeBusiness.location}</p>`
                : ""
            }
            <p style="margin: 0; font-size: 11px;">${activeBusiness?.country || ""}</p>
          </div>

          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <div style="text-align: center; margin-bottom: 8px;">
            <p style="font-weight: bold; font-size: 13px; margin: 0;">SALES RECEIPT</p>
          </div>

          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Receipt #:</span>
              <span style="font-weight: bold;">${lastTransaction.id?.slice(0, 8).toUpperCase()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Date:</span>
              <span>${formatDate(lastTransaction.createdAt)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Time:</span>
              <span>${formatTime(lastTransaction.createdAt)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Customer:</span>
              <span>${lastTransaction.customerName || "Casual Customer"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Served by:</span>
              <span>${user?.fullName || ""}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Payment:</span>
              <span style="font-weight: bold;">${lastTransaction.paymentMethod}</span>
            </div>
          </div>

          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <div style="margin-bottom: 8px;">
            <p style="font-weight: bold; margin: 0 0 6px 0;">ITEMS</p>
            ${itemsHTML}
          </div>

          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
            <span>TOTAL</span>
            <span>${currency} ${formatAmount(lastTransaction.totalAmount)}</span>
          </div>

          ${notesHTML}

          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
          <div style="text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 11px;">Thank you for your business!</p>
            <p style="margin: 0; font-size: 10px; color: #666;">Powered by BizManager</p>
          </div>

        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  // ─────────────────────────────────────────
  // FETCH PRODUCTS
  // ─────────────────────────────────────────
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", businessId],
    queryFn: () => productService.getAll(businessId),
  });

  const products = productsData?.data || [];

  // ─────────────────────────────────────────
  // FILTER PRODUCTS
  // ─────────────────────────────────────────
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────
  // CART OPERATIONS
  // ─────────────────────────────────────────
  const addToCart = (product) => {
    const existing = cart.find((item) => item.productId === product.id);

    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantitySold: item.quantitySold + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          quantitySold: 1,
          unitPrice: product.price ? product.price.toString() : "",
          defaultPrice: product.price || 0,
          availableStock: product.primaryStock?.quantity || 0,
        },
      ]);
    }
    setSearch("");
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, value) => {
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantitySold: Math.max(1, parseFloat(value) || 1) }
          : item
      )
    );
  };

  const updatePrice = (productId, value) => {
    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, unitPrice: value } : item
      )
    );
  };

  // ─────────────────────────────────────────
  // TOTALS
  // ─────────────────────────────────────────
  const cartTotal = cart.reduce((sum, item) => {
    return sum + item.quantitySold * (parseFloat(item.unitPrice) || 0);
  }, 0);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // ─────────────────────────────────────────
  // SUBMIT TRANSACTION
  // ─────────────────────────────────────────
  const transactionMutation = useMutation({
    mutationFn: (data) => transactionService.create(businessId, data),
    onSuccess: (res) => {
      setLastTransaction(res.data);
      setShowSuccess(true);
      setCart([]);
      setPaymentMethod("");
      setNotes("");
      setCustomerName("");
      setApiError("");
    },
    onError: (error) => {
      setApiError(error.response?.data?.message || "Could not record sale");
    },
  });

  const handleSubmit = () => {
    setApiError("");

    if (cart.length === 0) {
      setApiError("Add at least one product to the cart");
      return;
    }

    const missingPrice = cart.find(
      (item) => !item.unitPrice || parseFloat(item.unitPrice) <= 0
    );
    if (missingPrice) {
      setApiError(`Please set a price for "${missingPrice.productName}"`);
      return;
    }

    const insufficientStock = cart.find(
      (item) => item.quantitySold > item.availableStock
    );
    if (insufficientStock) {
      setApiError(
        `Insufficient stock for "${insufficientStock.productName}". ` +
          `Available: ${insufficientStock.availableStock} ${insufficientStock.unit}`
      );
      return;
    }

    if (!paymentMethod) {
      setApiError("Please select a payment method");
      return;
    }

    transactionMutation.mutate({
      paymentMethod,
      notes,
      customerName: customerName.trim() || "Casual Customer",
      items: cart.map((item) => ({
        productId: item.productId,
        quantitySold: item.quantitySold,
        unitPrice: parseFloat(item.unitPrice),
      })),
    });
  };

  // ─────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────
  if (showSuccess) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center py-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Sale Recorded!</h2>
          <p className="text-dark-400 mb-2">Transaction saved successfully</p>
          <p className="text-dark-500 text-sm mb-8">
            Customer:{" "}
            <span className="text-white">
              {lastTransaction?.customerName || "Casual Customer"}
            </span>
          </p>

          {/* Transaction Summary Card */}
          {lastTransaction && (
            <div className="card p-6 text-left mb-6">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-dark-700">
                <div>
                  <p className="text-dark-400 text-xs mb-0.5">Customer</p>
                  <p className="text-white font-medium">
                    {lastTransaction.customerName || "Casual Customer"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-dark-400 text-xs mb-0.5">Total</p>
                  <p className="text-white font-bold text-xl">
                    {currency} {formatAmount(lastTransaction.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-dark-400 text-sm">Payment</span>
                <span className="text-white text-sm font-medium">
                  {lastTransaction.paymentMethod === "CASH" ? (
                    <span className="flex items-center gap-1">
                      <Banknote size={14} className="text-green-400" />
                      Cash
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <ArrowLeftRight size={14} className="text-blue-400" />
                      Transfer
                    </span>
                  )}
                </span>
              </div>

              {/* Items Count */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-dark-400 text-sm">Items</span>
                <span className="text-white text-sm">
                  {lastTransaction.items?.length} item
                  {lastTransaction.items?.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2 pt-4 border-t border-dark-700">
                {lastTransaction.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-dark-300 text-sm">
                      {item.product.name} × {item.quantitySold}
                    </span>
                    <span className="text-white text-sm">
                      {currency} {formatAmount(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Button
              variant="secondary"
              onClick={printReceipt}
              className="flex items-center justify-center gap-2"
            >
              <Printer size={16} />
              Print Receipt
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                navigate(`/businesses/${businessId}/transactions`)
              }
            >
              View Transactions
            </Button>
          </div>

          <Button className="w-full" onClick={() => setShowSuccess(false)}>
            New Sale
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="New Sale"
        description="Record a new sales transaction"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Customer Name */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-dark-400" />
              <p className="text-white font-medium">Customer</p>
            </div>
            <input
              type="text"
              placeholder="Casual Customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-base"
            />
            <p className="text-dark-500 text-xs mt-1.5">
              Leave empty for "Casual Customer"
            </p>
          </div>

          {/* Product Search */}
          <div className="card p-4">
            <p className="text-white font-medium mb-3">Search Products</p>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
              />
              <input
                type="text"
                placeholder="Type product name to search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-10"
              />
            </div>

            {/* Search Results */}
            {search && (
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {isLoading && (
                  <p className="text-dark-400 text-sm text-center py-4">
                    Loading products...
                  </p>
                )}
                {!isLoading && filteredProducts.length === 0 && (
                  <p className="text-dark-400 text-sm text-center py-4">
                    No products found
                  </p>
                )}
                {filteredProducts.map((product) => {
                  const inCart = cart.find((i) => i.productId === product.id);
                  const primaryStock = product.primaryStock?.quantity || 0;
                  const isOutOfStock = primaryStock === 0;

                  return (
                    <button
                      key={product.id}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      disabled={isOutOfStock}
                      className={`w-full flex items-center justify-between
                                  p-3 rounded-lg transition-colors text-left
                                  ${
                                    isOutOfStock
                                      ? "opacity-50 cursor-not-allowed bg-dark-800"
                                      : "bg-dark-800 hover:bg-dark-700 cursor-pointer"
                                  }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-600/10 rounded-lg flex items-center justify-center">
                          <Package size={14} className="text-primary-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="text-dark-400 text-xs">
                            {primaryStock} {product.unit} available
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOutOfStock ? (
                          <span className="badge-red">Out of Stock</span>
                        ) : inCart ? (
                          <span className="badge-green">In Cart</span>
                        ) : (
                          <ChevronRight size={16} className="text-dark-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Items */}
          {cart.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-dark-700 flex items-center justify-between">
                <h3 className="text-white font-medium">
                  Cart ({cart.length} item{cart.length !== 1 ? "s" : ""})
                </h3>
                <button
                  onClick={() => setCart([])}
                  className="text-dark-400 hover:text-red-400 text-xs transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="divide-y divide-dark-800">
                {cart.map((item) => {
                  const subtotal =
                    item.quantitySold * (parseFloat(item.unitPrice) || 0);
                  const isOverStock = item.quantitySold > item.availableStock;

                  return (
                    <div key={item.productId} className="p-4">
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-medium">
                            {item.productName}
                          </p>
                          <p className="text-dark-400 text-xs mt-0.5">
                            Available: {item.availableStock} {item.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-dark-500 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Quantity */}
                        <div>
                          <label className="text-dark-400 text-xs mb-1.5 block">
                            Quantity ({item.unit})
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantitySold - 1)
                              }
                              disabled={item.quantitySold <= 1}
                              className="w-8 h-8 bg-dark-700 hover:bg-dark-600
                                         rounded-lg flex items-center justify-center
                                         text-white disabled:opacity-50
                                         transition-colors flex-shrink-0"
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              value={item.quantitySold}
                              onChange={(e) =>
                                updateQuantity(item.productId, e.target.value)
                              }
                              min="1"
                              className={`input-base text-center py-2 px-2 ${
                                isOverStock ? "border-red-500" : ""
                              }`}
                            />
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantitySold + 1)
                              }
                              className="w-8 h-8 bg-dark-700 hover:bg-dark-600
                                         rounded-lg flex items-center justify-center
                                         text-white transition-colors flex-shrink-0"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          {isOverStock && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={11} />
                              Exceeds available stock
                            </p>
                          )}
                        </div>

                        {/* Unit Price */}
                        <div>
                          <label className="text-dark-400 text-xs mb-1.5 block">
                            Unit Price ({currency})
                            {item.defaultPrice > 0 &&
                              parseFloat(item.unitPrice) !== item.defaultPrice && (
                                <span className="text-yellow-400 ml-1 text-xs">
                                  (Modified — Default: {currency}{" "}
                                  {formatAmount(item.defaultPrice)})
                                </span>
                              )}
                          </label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updatePrice(item.productId, e.target.value)
                            }
                            min="0"
                            className={`input-base py-2 ${
                              !item.unitPrice ? "border-yellow-500/50" : ""
                            }`}
                          />
                          {item.defaultPrice > 0 &&
                            parseFloat(item.unitPrice) !== item.defaultPrice && (
                              <button
                                type="button"
                                onClick={() =>
                                  updatePrice(
                                    item.productId,
                                    item.defaultPrice.toString()
                                  )
                                }
                                className="text-primary-400 text-xs mt-1 hover:underline"
                              >
                                Reset to default price
                              </button>
                            )}
                        </div>
                      </div>

                      {/* Subtotal */}
                      {item.unitPrice && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-800">
                          <span className="text-dark-400 text-sm">Subtotal</span>
                          <span className="text-white font-semibold">
                            {currency} {formatAmount(subtotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Cart */}
          {cart.length === 0 && !search && (
            <div className="card p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingCart size={28} className="text-dark-500" />
              </div>
              <h3 className="text-white font-medium mb-1">Cart is Empty</h3>
              <p className="text-dark-400 text-sm">
                Search for products above to add them to the cart
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4">

          {/* Payment Method */}
          <div className="card p-4">
            <p className="text-white font-medium mb-3">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("CASH")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl
                            border-2 transition-all duration-200 ${
                              paymentMethod === "CASH"
                                ? "border-green-500 bg-green-500/10"
                                : "border-dark-600 hover:border-dark-500"
                            }`}
              >
                <Banknote
                  size={24}
                  className={
                    paymentMethod === "CASH" ? "text-green-400" : "text-dark-400"
                  }
                />
                <span
                  className={`text-sm font-medium ${
                    paymentMethod === "CASH" ? "text-green-400" : "text-dark-400"
                  }`}
                >
                  Cash
                </span>
              </button>

              <button
                onClick={() => setPaymentMethod("TRANSFER")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl
                            border-2 transition-all duration-200 ${
                              paymentMethod === "TRANSFER"
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-dark-600 hover:border-dark-500"
                            }`}
              >
                <ArrowLeftRight
                  size={24}
                  className={
                    paymentMethod === "TRANSFER"
                      ? "text-blue-400"
                      : "text-dark-400"
                  }
                />
                <span
                  className={`text-sm font-medium ${
                    paymentMethod === "TRANSFER"
                      ? "text-blue-400"
                      : "text-dark-400"
                  }`}
                >
                  Transfer
                </span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="card p-4">
            <p className="text-white font-medium mb-3">Notes (Optional)</p>
            <textarea
              placeholder="Add any notes about this sale..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-base resize-none"
            />
          </div>

          {/* Order Summary */}
          <div className="card p-4">
            <p className="text-white font-medium mb-4">Order Summary</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-dark-400 text-sm">Customer</span>
                <span className="text-white text-sm">
                  {customerName.trim() || "Casual Customer"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400 text-sm">Items</span>
                <span className="text-white text-sm">
                  {cart.length} product{cart.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400 text-sm">Payment</span>
                <span className="text-white text-sm">
                  {paymentMethod || "Not selected"}
                </span>
              </div>
            </div>

            <div className="border-t border-dark-700 pt-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-white font-bold text-xl">
                  {currency} {formatAmount(cartTotal)}
                </span>
              </div>
            </div>

            {apiError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{apiError}</p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              loading={transactionMutation.isPending}
              disabled={cart.length === 0}
            >
              <CheckCircle size={18} />
              Record Sale
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}