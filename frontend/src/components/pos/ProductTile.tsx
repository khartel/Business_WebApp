import type { Product } from "@/services/product.service"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ProductTile({
  product,
  currency,
  cartQuantity,
  onAdd,
}: {
  product: Product
  currency: string
  cartQuantity: number
  onAdd: () => void
}) {
  const stock = product.primaryStock?.quantity ?? 0
  const isOutOfStock = stock <= 0
  const isLow = stock > 0 && stock <= (product.primaryStock?.lowStockThreshold ?? 10)

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={isOutOfStock}
      className={cn(
        "group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border p-4 text-left shadow-sm backdrop-blur-xl transition-all duration-150",
        "bg-card/60 ring-1 ring-foreground/10 dark:bg-card/40 dark:ring-white/10",
        isOutOfStock
          ? "cursor-not-allowed opacity-40"
          : "hover:-translate-y-0.5 hover:shadow-lg hover:ring-success/40 active:translate-y-0 active:scale-[0.98]"
      )}
    >
      {cartQuantity > 0 && (
        <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-success text-xs font-semibold text-primary-foreground shadow-[0_0_12px_var(--glow-primary)]">
          {cartQuantity}
        </span>
      )}

      <p className="line-clamp-2 pr-6 font-heading text-sm font-semibold leading-snug">
        {product.name}
      </p>
      <p className="font-heading text-base font-semibold text-success">
        {formatMoney(product.price, currency)}
      </p>

      <div className="mt-auto flex items-center gap-1.5 text-xs">
        <span
          className={cn(
            "size-1.5 rounded-full",
            isOutOfStock ? "bg-destructive" : isLow ? "bg-chart-4" : "bg-success"
          )}
        />
        <span className="text-muted-foreground">
          {isOutOfStock ? "Out of stock" : `${stock} ${product.unit} left`}
        </span>
      </div>
    </button>
  )
}
