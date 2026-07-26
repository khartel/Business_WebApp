import { useQuery } from "@tanstack/react-query"
import { Printer } from "lucide-react"
import * as transactionService from "@/services/transaction.service"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { formatDateTime, formatMoney } from "@/lib/format"
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
      <SheetContent className="sm:max-w-md">
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
            <div className="receipt-print-area space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{transaction.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment method</p>
                  <Badge variant="secondary">{transaction.paymentMethod}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Served by</p>
                  <p className="font-medium">{transaction.performedBy.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Warehouse</p>
                  <p className="font-medium">{transaction.warehouse.name}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transaction.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product.name}
                          {!!item.discountPercent && (
                            <span className="ml-1.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                              -{item.discountPercent}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.quantitySold} {item.product.unit}
                        </TableCell>
                        <TableCell className="text-right">{formatMoney(item.subtotal, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {transaction.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{transaction.notes}</p>
                </div>
              )}

              {transaction.paymentMethod === "CREDIT" && transaction.payments.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Payments recorded</p>
                  <ul className="space-y-1 text-sm">
                    {transaction.payments.map((payment) => (
                      <li key={payment.id} className="flex justify-between text-muted-foreground">
                        <span>
                          {formatDateTime(payment.createdAt)} · {payment.recordedBy.fullName}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatMoney(payment.amount, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                <span className="text-sm font-medium">Total</span>
                <span className="font-heading text-lg font-semibold">
                  {formatMoney(transaction.totalAmount, currency)}
                </span>
              </div>

              {transaction.paymentMethod === "CREDIT" && (
                <div className="flex items-center justify-between rounded-lg bg-destructive/10 px-4 py-3">
                  <span className="text-sm font-medium text-destructive">
                    {transaction.balanceDue > 0 ? "Balance due" : "Fully paid"}
                  </span>
                  {transaction.balanceDue > 0 && (
                    <span className="font-heading text-lg font-semibold text-destructive">
                      {formatMoney(transaction.balanceDue, currency)}
                    </span>
                  )}
                </div>
              )}

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
