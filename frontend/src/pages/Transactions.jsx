import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { transactionService } from "../services/transaction.service";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  Banknote,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Package,
  User,
  Calendar,
  TrendingUp,
} from "lucide-react";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";

export default function Transactions() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin } = useAuth();

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);

  const activeBusiness = localStorage.getItem("activeBusiness")
    ? JSON.parse(localStorage.getItem("activeBusiness"))
    : null;

  const currency = activeBusiness?.currency || "";

  // ─────────────────────────────────────────
  // FETCH TRANSACTIONS
  // ─────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["transactions", businessId, paymentFilter, page],
    queryFn: () =>
      transactionService.getAll(businessId, {
        paymentMethod: paymentFilter || undefined,
        page,
        limit: 20,
      }),
  });

  // ─────────────────────────────────────────
  // FETCH SUMMARY (admin/superadmin only)
  // ─────────────────────────────────────────
  const { data: summaryData } = useQuery({
    queryKey: ["transactions-summary", businessId],
    queryFn: () => transactionService.getSummary(businessId),
    enabled: isSuperAdmin || isAdmin,
  });

  const transactions = data?.data?.transactions || [];
  const pagination = data?.data?.pagination || {};
  const summary = summaryData?.data || null;

  // ─────────────────────────────────────────
  // FORMAT HELPERS
  // ─────────────────────────────────────────
  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

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

  // ─────────────────────────────────────────
  // FILTER BY SEARCH
  // ─────────────────────────────────────────
  const filteredTransactions = transactions.filter((t) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      t.performedBy?.fullName?.toLowerCase().includes(searchLower) ||
      t.performedBy?.username?.toLowerCase().includes(searchLower) ||
      t.items?.some((item) =>
        item.product?.name?.toLowerCase().includes(searchLower)
      )
    );
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
        title="Transactions"
        description="All sales transactions"
        action={
          <Button
            onClick={() =>
              navigate(`/businesses/${businessId}/transactions/new`)
            }
          >
            <Plus size={18} />
            New Sale
          </Button>
        }
      />

      {/* Summary Cards (Admin/SuperAdmin only) */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">Today's Sales</p>
            <p className="text-white text-xl font-bold">
              {currency} {formatAmount(summary.today?.totalAmount || 0)}
            </p>
            <p className="text-dark-500 text-xs mt-1">
              {summary.today?.transactionCount || 0} transactions
            </p>
          </div>

          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">Cash Today</p>
            <p className="text-green-400 text-xl font-bold">
              {currency} {formatAmount(summary.today?.cashTotal || 0)}
            </p>
            <p className="text-dark-500 text-xs mt-1">
              {summary.today?.cashTransactions || 0} transactions
            </p>
          </div>

          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">Transfer Today</p>
            <p className="text-blue-400 text-xl font-bold">
              {currency}{" "}
              {formatAmount(summary.today?.transferTotal || 0)}
            </p>
            <p className="text-dark-500 text-xs mt-1">
              {summary.today?.transferTransactions || 0} transactions
            </p>
          </div>

          <div className="card p-4">
            <p className="text-dark-400 text-xs mb-1">This Month</p>
            <p className="text-primary-400 text-xl font-bold">
              {currency}{" "}
              {formatAmount(summary.monthly?.totalAmount || 0)}
            </p>
            <p className="text-dark-500 text-xs mt-1">
              {summary.monthly?.transactionCount || 0} transactions
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
          />
          <input
            type="text"
            placeholder="Search by employee or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
          />
        </div>

        {/* Payment Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-dark-400" />
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="input-base w-auto"
          >
            <option value="">All Payments</option>
            <option value="CASH">Cash Only</option>
            <option value="TRANSFER">Transfer Only</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {transactions.length === 0 && (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions yet"
          description="Record your first sale to see it here"
          action={
            <Button
              onClick={() =>
                navigate(`/businesses/${businessId}/transactions/new`)
              }
            >
              <Plus size={18} />
              New Sale
            </Button>
          }
        />
      )}

      {/* Transactions List */}
      {filteredTransactions.length > 0 && (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="card overflow-hidden">
              {/* Transaction Header */}
              <button
                onClick={() =>
                  setExpandedId(
                    expandedId === transaction.id
                      ? null
                      : transaction.id
                  )
                }
                className="w-full p-4 flex items-center justify-between
                           hover:bg-dark-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Payment Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center
                                justify-center flex-shrink-0 ${
                                  transaction.paymentMethod === "CASH"
                                    ? "bg-green-500/10"
                                    : "bg-blue-500/10"
                                }`}
                  >
                    {transaction.paymentMethod === "CASH" ? (
                      <Banknote size={18} className="text-green-400" />
                    ) : (
                      <CreditCard size={18} className="text-blue-400" />
                    )}
                  </div>

                  {/* Transaction Info */}
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">
                        {currency}{" "}
                        {formatAmount(transaction.totalAmount)}
                      </span>
                      <span
                        className={
                          transaction.paymentMethod === "CASH"
                            ? "badge-green"
                            : "badge-blue"
                        }
                      >
                        {transaction.paymentMethod === "CASH"
                          ? "Cash"
                          : "Transfer"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <User size={11} className="text-dark-500" />
                        <span className="text-dark-400 text-xs">
                          {transaction.performedBy?.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package size={11} className="text-dark-500" />
                        <span className="text-dark-400 text-xs">
                          {transaction.items?.length} item
                          {transaction.items?.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={11} className="text-dark-500" />
                        <span className="text-dark-400 text-xs">
                          {formatDate(transaction.createdAt)}{" "}
                          {formatTime(transaction.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expand Icon */}
                <div className="text-dark-400 flex-shrink-0">
                  {expandedId === transaction.id ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {expandedId === transaction.id && (
                <div className="border-t border-dark-700 p-4">
                  {/* Items Table */}
                  <p className="text-dark-400 text-xs font-medium
                                uppercase tracking-wider mb-3">
                    Items Sold
                  </p>
                  <div className="space-y-2 mb-4">
                    {transaction.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between
                                   bg-dark-800 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Package
                            size={14}
                            className="text-dark-400"
                          />
                          <span className="text-white text-sm">
                            {item.product?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-dark-400">
                            {item.quantitySold} {item.product?.unit} ×{" "}
                            {currency} {formatAmount(item.unitPrice)}
                          </span>
                          <span className="text-white font-medium">
                            {currency} {formatAmount(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between
                                  pt-3 border-t border-dark-700">
                    <div>
                      {transaction.notes && (
                        <p className="text-dark-400 text-sm">
                          📝 {transaction.notes}
                        </p>
                      )}
                      <p className="text-dark-500 text-xs mt-1">
                        Sold by {transaction.performedBy?.fullName} •{" "}
                        {transaction.warehouse?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-dark-400 text-xs">Total</p>
                      <p className="text-white font-bold text-lg">
                        {currency}{" "}
                        {formatAmount(transaction.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No search results */}
      {transactions.length > 0 && filteredTransactions.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-dark-400">No transactions match your search</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-dark-400 text-sm">
            Page {pagination.page} of {pagination.totalPages} •{" "}
            {pagination.total} total transactions
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 px-4 py-2 text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className="btn-secondary disabled:opacity-50 px-4 py-2 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}