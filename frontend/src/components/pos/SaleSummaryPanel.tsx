import { Banknote, HandCoins, Landmark, Loader2, Receipt } from "lucide-react"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CustomerNameField } from "@/components/pos/CustomerNameField"
import type { CartLine } from "@/components/pos/CartItemsPanel"
import type { PaymentMethod } from "@/services/transaction.service"

interface SaleSummaryPanelProps {
  businessId: string
  cart: CartLine[]
  currency: string
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  customerName: string
  onCustomerNameChange: (value: string) => void
  customerNameRequired: boolean
  customerNameError?: string
  transferNote: string
  onTransferNoteChange: (value: string) => void
  onComplete: () => void
  isSubmitting: boolean
}

export function SaleSummaryPanel({
  businessId,
  cart,
  currency,
  paymentMethod,
  onPaymentMethodChange,
  customerName,
  onCustomerNameChange,
  customerNameRequired,
  customerNameError,
  transferNote,
  onTransferNoteChange,
  onComplete,
  isSubmitting,
}: SaleSummaryPanelProps) {
  const total = cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)

  return (
    <div className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-border/60 bg-card/60 p-5 shadow-lg backdrop-blur-2xl dark:bg-card/40">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="size-4.5 text-success" />
          <h2 className="font-heading text-base font-semibold">Sale details</h2>
        </div>

        <CustomerNameField
          businessId={businessId}
          placeholder={customerNameRequired ? "Customer name (required for credit)" : "Customer name (optional)"}
          value={customerName}
          onChange={onCustomerNameChange}
          required={customerNameRequired}
          error={customerNameError}
        />

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onPaymentMethodChange("CASH")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              paymentMethod === "CASH"
                ? "border-transparent bg-gradient-to-r from-primary to-success text-primary-foreground shadow-[0_0_16px_var(--glow-primary)]"
                : "border-border/60 text-muted-foreground hover:bg-muted"
            )}
          >
            <Banknote className="size-4" />
            Cash
          </button>
          <button
            type="button"
            onClick={() => onPaymentMethodChange("TRANSFER")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              paymentMethod === "TRANSFER"
                ? "border-transparent bg-gradient-to-r from-primary to-success text-primary-foreground shadow-[0_0_16px_var(--glow-primary)]"
                : "border-border/60 text-muted-foreground hover:bg-muted"
            )}
          >
            <Landmark className="size-4" />
            Transfer
          </button>
          <button
            type="button"
            onClick={() => onPaymentMethodChange("CREDIT")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              paymentMethod === "CREDIT"
                ? "border-transparent bg-gradient-to-r from-primary to-success text-primary-foreground shadow-[0_0_16px_var(--glow-primary)]"
                : "border-border/60 text-muted-foreground hover:bg-muted"
            )}
          >
            <HandCoins className="size-4" />
            Credit
          </button>
        </div>

        {paymentMethod === "TRANSFER" && (
          <Input
            placeholder="Transfer note (e.g. reference, sender name)"
            value={transferNote}
            onChange={(e) => onTransferNoteChange(e.target.value)}
          />
        )}

        {paymentMethod === "CREDIT" && (
          <p className="text-xs text-muted-foreground">
            This sale will be recorded as owed — the customer name above is how you'll track who owes it.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="font-heading text-2xl font-bold tabular-nums">
            {formatMoney(total, currency)}
          </span>
        </div>

        <Button
          className="w-full rounded-xl bg-gradient-to-r from-primary to-success py-6 text-base font-semibold text-primary-foreground shadow-[0_0_24px_var(--glow-primary)] hover:opacity-90"
          disabled={cart.length === 0 || isSubmitting}
          onClick={onComplete}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Complete sale
        </Button>
      </div>
    </div>
  )
}
