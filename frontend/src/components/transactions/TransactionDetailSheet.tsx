import { useQuery } from "@tanstack/react-query"
import { Printer } from "lucide-react"
import * as transactionService from "@/services/transaction.service"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { formatDate, formatDateTime, formatMoney } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

/**
 * Slide-over sheet that renders a single transaction as a printable sales receipt,
 * plus a "Print receipt" button (uses the browser's native `window.print()`; the
 * `.receipt-print-area` / `print:hidden` classes control what's included when printing).
 *
 * Props:
 * - transactionId: when null the sheet is closed; setting it triggers the detail
 *   fetch (query is `enabled: !!transactionId`).
 * - onOpenChange: called when the sheet is dismissed.
 *
 * Branding data source: the receipt's title, footer note, and whether to show the
 * signature lines are NOT hardcoded — they come from the active business's own
 * settings (`activeBusiness.receiptTitle`, `receiptFooterNote`, `receiptShowSignature`,
 * set on the Settings page) via `useActiveBusiness()`, each with a sensible fallback
 * ("RECEIPT", "Thank you for your business!", and `true` respectively) so receipts
 * still render correctly for businesses that haven't customized them.
 *
 * Also shows CREDIT-specific details when relevant: remaining balance due (or "Fully
 * paid"), and a log of payments already recorded against the transaction.
 */
export function TransactionDetailSheet({
  businessId,
  transactionId,
  onOpenChange,
}: {
  businessId: string
  transactionId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? "USD"

  const transactionQuery = useQuery({
    queryKey: ["transaction", businessId, transactionId],
    queryFn: () => transactionService.getTransactionById(businessId, transactionId!),
    enabled: !!transactionId,
  })

  const transaction = transactionQuery.data

  return (
    <Sheet open={!!transactionId} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Sale receipt</SheetTitle>
          <SheetDescription>
            {transaction ? formatDateTime(transaction.createdAt) : "Loading..."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          {transactionQuery.isLoading || !transaction ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <div className="space-y-3">
              <div className="receipt-print-area rounded-xl border border-slate-200 bg-white p-6 text-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading text-base font-bold">{activeBusiness?.name}</p>
                    {activeBusiness?.location && (
                      <p className="text-sm text-slate-500">{activeBusiness.location}</p>
                    )}
                  </div>
                  <p className="text-2xl font-bold tracking-[0.2em] text-slate-800">
                    {activeBusiness?.receiptTitle ?? "RECEIPT"}
                  </p>
                </div>

                <div className="mt-6 flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Billed To</p>
                    <p className="font-medium">{transaction.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p>
                      <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Receipt #{" "}
                      </span>
                      <span className="font-medium">{transaction.id.slice(0, 8).toUpperCase()}</span>
                    </p>
                    <p>
                      <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Receipt date{" "}
                      </span>
                      <span className="font-medium">{formatDate(transaction.createdAt)}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="bg-slate-800 text-white">Qty</TableHead>
                        <TableHead className="bg-slate-800 text-white">Description</TableHead>
                        <TableHead className="bg-slate-800 text-right text-white">Unit price</TableHead>
                        <TableHead className="bg-slate-800 text-right text-white">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transaction.items.map((item) => (
                        <TableRow key={item.id} className="border-slate-200 hover:bg-transparent">
                          <TableCell>
                            {item.quantitySold} {item.product.unit}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.product.name}
                            {!!item.discountPercent && (
                              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                -{item.discountPercent}%
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{formatMoney(item.unitPrice, currency)}</TableCell>
                          <TableCell className="text-right">{formatMoney(item.subtotal, currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="w-full max-w-56 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-bold">
                      <span>Total ({currency})</span>
                      <span>{formatMoney(transaction.totalAmount, currency)}</span>
                    </div>
                    {transaction.paymentMethod === "CREDIT" && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>{transaction.balanceDue > 0 ? "Balance due" : "Fully paid"}</span>
                        {transaction.balanceDue > 0 && (
                          <span className="font-medium">{formatMoney(transaction.balanceDue, currency)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>Payment method:</span>
                  <Badge variant="secondary" className="border-slate-200 bg-slate-100 text-slate-700">
                    {transaction.paymentMethod}
                  </Badge>
                  <span className="ml-auto">Served by {transaction.performedBy.fullName}</span>
                </div>

                {transaction.paymentMethod === "CREDIT" && transaction.payments.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      Payments recorded
                    </p>
                    <ul className="space-y-1 text-sm">
                      {transaction.payments.map((payment) => (
                        <li key={payment.id} className="flex justify-between text-slate-500">
                          <span>
                            {formatDateTime(payment.createdAt)} · {payment.recordedBy.fullName}
                          </span>
                          <span className="font-medium text-slate-900">
                            {formatMoney(payment.amount, currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {transaction.notes && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Notes</p>
                    <p className="text-sm">{transaction.notes}</p>
                  </div>
                )}

                {(activeBusiness?.receiptShowSignature ?? true) && (
                  <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
                    <div>
                      <div className="h-8 border-b border-slate-400" />
                      <p className="mt-1.5 text-xs text-slate-500">Customer signature</p>
                    </div>
                    <div>
                      <div className="h-8 border-b border-slate-400" />
                      <p className="mt-1.5 text-xs text-slate-500">Received by</p>
                    </div>
                  </div>
                )}

                <p className="mt-8 text-center text-xs text-slate-400">
                  {activeBusiness?.receiptFooterNote ?? "Thank you for your business!"}
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full print:hidden"
                onClick={() => window.print()}
              >
                <Printer className="size-4" />
                Print receipt
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
