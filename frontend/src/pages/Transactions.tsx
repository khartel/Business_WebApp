import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react"
import * as transactionService from "@/services/transaction.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { formatDateTime, formatMoney } from "@/lib/format"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/EmptyState"
import { NewSaleDialog } from "@/components/transactions/NewSaleDialog"
import { TransactionDetailSheet } from "@/components/transactions/TransactionDetailSheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Transactions() {
  const { activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? "USD"
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const transactionsQuery = useQuery({
    queryKey: ["transactions", activeBusinessId, page],
    queryFn: () => transactionService.getTransactions(activeBusinessId!, { page, limit: 20 }),
    enabled: !!activeBusinessId,
  })

  if (!activeBusinessId) {
    return (
      <EmptyState
        icon={<Receipt className="size-6" />}
        title="No business selected"
        description="Select or create a business to record sales."
      />
    )
  }

  const data = transactionsQuery.data
  const transactions = data?.transactions ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Sales" description={activeBusiness ? `Transactions for ${activeBusiness.name}` : undefined} action={<NewSaleDialog />} />

      {transactionsQuery.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-6" />}
          title="No sales yet"
          description="Record your first sale to see it here."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Served by</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(tx.id)}
                  >
                    <TableCell className="text-muted-foreground">{formatDateTime(tx.createdAt)}</TableCell>
                    <TableCell className="font-medium">{tx.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.items.length} item{tx.items.length !== 1 && "s"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tx.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.performedBy.fullName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(tx.totalAmount, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} sales
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <TransactionDetailSheet
        businessId={activeBusinessId}
        transactionId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  )
}
