import { Banknote, Landmark, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PaymentMethod } from "@/services/transaction.service"

export interface CartLine {
  productId: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  availableStock: number
}

interface CartTicketProps {
  cart: CartLine[]
  currency: string
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  customerName: string
  onCustomerNameChange: (value: string) => void
  onIncrement: (productId: string) => void
  onDecrement: (productId: string) => void
  onPriceChange: (productId: string, price: number) => void
  onRemove: (productId: string) => void
  onComplete: () => void
  isSubmitting: boolean
}

export function CartTicket({
  cart,
  currency,
  paymentMethod,
  onPaymentMethodChange,
  customerName,
  onCustomerNameChange,
  onIncrement,
  onDecrement,
  onPriceChange,
  onRemove,
  onComplete,
  isSubmitting,
}: CartTicketProps) {
  const total = cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)

  return (
    <div className="flex h-full flex-col rounded-3xl border border-border/60 bg-card/60 shadow-lg backdrop-blur-2xl dark:bg-card/40">
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
        <ShoppingCart className="size-4.5 text-success" />
        <h2 className="font-heading text-base font-semibold">Current sale</h2>
        {cart.length > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {cart.length} item{cart.length !== 1 && "s"}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <ShoppingCart className="size-8 opacity-40" />
            <p className="text-sm">Tap a product to add it to the sale</p>
          </div>
        ) : (
          cart.map((line) => (
            <div key={line.productId} className="rounded-xl border border-border/60 bg-background/40 p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{line.name}</p>
                <button
                  type="button"
                  onClick={() => onRemove(line.productId)}
                  aria-label={`Remove ${line.name}`}
                  className="shrink-0 rounded text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-0.5">
                  <button
                    type="button"
                    onClick={() => onDecrement(line.productId)}
                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncrement(line.productId)}
                    disabled={line.quantity >= line.availableStock}
                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>

                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={line.unitPrice}
                  onChange={(e) => onPriceChange(line.productId, parseFloat(e.target.value) || 0)}
                  className="h-7 w-20 text-right text-xs"
                />

                <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {formatMoney(line.quantity * line.unitPrice, currency)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4 border-t border-border/60 px-5 py-4">
        <Input
          placeholder="Customer name (optional)"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onPaymentMethodChange("CASH")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
              "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              paymentMethod === "TRANSFER"
                ? "border-transparent bg-gradient-to-r from-primary to-success text-primary-foreground shadow-[0_0_16px_var(--glow-primary)]"
                : "border-border/60 text-muted-foreground hover:bg-muted"
            )}
          >
            <Landmark className="size-4" />
            Transfer
          </button>
        </div>

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
