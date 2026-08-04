import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import * as customerService from "@/services/customer.service"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { formatDateTime, formatMoney } from "@/lib/format"
import { SummaryStat } from "@/components/reports/SummaryStat"
import { EmptyState } from "@/components/EmptyState"
import { TransactionDetailSheet } from "@/components/transactions/TransactionDetailSheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { History } from "lucide-react"

/**
 * Centered dialog showing a single customer's profile: visit count, total spent,
 * outstanding credit ("Owes"), and their transaction history. Wide enough
 * (`sm:max-w-2xl`) for the three stat tiles and the transaction table's Date/
 * Payment/Total columns to sit comfortably without truncating or needing a
 * horizontal scrollbar — a right-side sheet was tried here first but was too
 * narrow for this much side-by-side content.
 *
 * Props:
 * - customerId: when null the dialog is closed; setting it triggers the detail
 *   fetch (query is `enabled: !!customerId`).
 * - onOpenChange: called when the dialog is dismissed.
 *
 * Behavior:
 * - `outstandingCredit` is the customer's running unpaid balance across CREDIT
 *   transactions, computed server-side and just displayed here.
 * - Clicking a transaction row opens a nested `TransactionDetailSheet` (tracked via
 *   local `transactionId` state) layered on top of this dialog.
 */
export function CustomerDetailSheet({
  businessId,
  customerId,
  onOpenChange,
}: {
  businessId: string
  customerId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? "USD"
  const [transactionId, setTransactionId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ["customer", businessId, customerId],
    queryFn: () => customerService.getCustomerById(businessId, customerId!),
    enabled: !!customerId,
  })

  const customer = query.data

  return (
    <>
      <Dialog open={!!customerId} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{customer?.name ?? t("Customer")}</DialogTitle>
            <DialogDescription>{customer?.phone || t("No phone on file")}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            {query.isLoading || !customer ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <SummaryStat label={t("Visits")} value={customer.transactionCount} />
                  <SummaryStat label={t("Total spent")} value={formatMoney(customer.totalSpent, currency)} />
                  <SummaryStat
                    label={t("Owes")}
                    value={formatMoney(customer.outstandingCredit, currency)}
                  />
                </div>

                {customer.transactions.length === 0 ? (
                  <EmptyState
                    icon={<History className="size-6" />}
                    title="No sales yet"
                    description="This customer hasn't made a purchase yet."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("Date")}</TableHead>
                          <TableHead>{t("Payment")}</TableHead>
                          <TableHead className="text-right">{t("Total")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.transactions.map((tx) => (
                          <TableRow
                            key={tx.id}
                            className="cursor-pointer"
                            onClick={() => setTransactionId(tx.id)}
                          >
                            <TableCell className="text-muted-foreground">
                              {formatDateTime(tx.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="secondary">{tx.paymentMethod}</Badge>
                                {tx.paymentMethod === "CREDIT" && (
                                  <Badge variant={tx.paidAt ? "secondary" : "destructive"}>
                                    {tx.paidAt
                                      ? t("Paid")
                                      : t("Owing {{amount}}", { amount: formatMoney(tx.balanceDue, currency) })}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatMoney(tx.totalAmount, currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TransactionDetailSheet
        businessId={businessId}
        transactionId={transactionId}
        onOpenChange={(open) => !open && setTransactionId(null)}
      />
    </>
  )
}
