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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
 * Slide-over sheet showing a single customer's profile: visit count, total spent,
 * outstanding credit ("Owes"), and their transaction history.
 *
 * Props:
 * - customerId: when null the sheet is closed; setting it triggers the detail fetch
 *   (query is `enabled: !!customerId`).
 * - onOpenChange: called when the sheet is dismissed.
 *
 * Behavior:
 * - `outstandingCredit` is the customer's running unpaid balance across CREDIT
 *   transactions, computed server-side and just displayed here.
 * - Clicking a transaction row opens a nested `TransactionDetailSheet` (tracked via
 *   local `transactionId` state) layered on top of this sheet.
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
      <Sheet open={!!customerId} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{customer?.name ?? t("Customer")}</SheetTitle>
            <SheetDescription>{customer?.phone || t("No phone on file")}</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-4">
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
        </SheetContent>
      </Sheet>

      <TransactionDetailSheet
        businessId={businessId}
        transactionId={transactionId}
        onOpenChange={(open) => !open && setTransactionId(null)}
      />
    </>
  )
}
