import { useState, type ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import * as transactionService from "@/services/transaction.service"
import { ApiError } from "@/lib/api-client"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * Dialog for recording a payment against a CREDIT transaction's outstanding balance.
 * Wraps whatever `trigger` element is passed in (e.g. a "Record payment" button).
 *
 * Props:
 * - balanceDue: the amount still owed on this transaction; caps the "partial" input
 *   and is the amount submitted when paying in full.
 * - trigger: element that opens the dialog.
 *
 * Behavior:
 * - Two modes: "full" (pays the entire `balanceDue`) or "partial" (user enters a
 *   custom amount, validated to be > 0 and <= balanceDue via `canSubmitPartial`).
 * - On success, invalidates transactions/customers queries (list, detail, and this
 *   specific transaction) so balances refresh everywhere, and reports whether the
 *   transaction is now fully paid or still has a remaining balance.
 */
export function RecordPaymentDialog({
  businessId,
  transactionId,
  customerName,
  balanceDue,
  currency,
  trigger,
}: {
  businessId: string
  transactionId: string
  customerName: string
  balanceDue: number
  currency: string
  trigger: ReactNode
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"full" | "partial">("full")
  const [amount, setAmount] = useState("")
  const queryClient = useQueryClient()

  const reset = () => {
    setMode("full")
    setAmount("")
  }

  const mutation = useMutation({
    mutationFn: (value: number) => transactionService.recordPayment(businessId, transactionId, value),
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", businessId] })
      queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
      queryClient.invalidateQueries({ queryKey: ["customer", businessId] })
      queryClient.invalidateQueries({ queryKey: ["transaction", businessId, transactionId] })
      toast.success(
        transaction.balanceDue <= 0
          ? t("Marked as fully paid")
          : t("Payment recorded — {{amount}} still owed", {
              amount: formatMoney(transaction.balanceDue, currency),
            })
      )
      setOpen(false)
      reset()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : t("Could not record payment")),
  })

  const parsedAmount = parseFloat(amount) || 0
  const canSubmitPartial = parsedAmount > 0 && parsedAmount <= balanceDue

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Record a payment")}</DialogTitle>
          <DialogDescription>
            {t("{{customerName}} owes {{amount}}.", {
              customerName,
              amount: formatMoney(balanceDue, currency),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("full")}
              className={cn(
                "rounded-xl border py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                mode === "full"
                  ? "border-transparent bg-gradient-to-r from-primary to-success text-primary-foreground shadow-[0_0_16px_var(--glow-primary)]"
                  : "border-border/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {t("Pay in full")}
            </button>
            <button
              type="button"
              onClick={() => setMode("partial")}
              className={cn(
                "rounded-xl border py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                mode === "partial"
                  ? "border-transparent bg-gradient-to-r from-primary to-success text-primary-foreground shadow-[0_0_16px_var(--glow-primary)]"
                  : "border-border/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {t("Enter amount")}
            </button>
          </div>

          {mode === "partial" && (
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">{t("Amount paid")}</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                max={balanceDue}
                step="any"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {parsedAmount > balanceDue && (
                <p className="text-xs text-destructive">
                  {t("Can't exceed the balance of {{amount}}", { amount: formatMoney(balanceDue, currency) })}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            disabled={mutation.isPending || (mode === "partial" && !canSubmitPartial)}
            onClick={() => mutation.mutate(mode === "full" ? balanceDue : parsedAmount)}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {mode === "full"
              ? t("Pay in full ({{amount}})", { amount: formatMoney(balanceDue, currency) })
              : t("Record payment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
