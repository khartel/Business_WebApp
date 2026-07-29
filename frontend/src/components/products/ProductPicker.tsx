import { useMemo, useState } from "react"
import type { Product } from "@/services/product.service"
import { Input } from "@/components/ui/input"

/**
 * Type-ahead search box for choosing one product from a list, used by flows like
 * receiving stock or building a POS sale line item.
 *
 * Props:
 * - products: full candidate list to search/filter client-side (no server call).
 * - value: currently selected product id (empty string if none).
 * - onChange: called with the selected product's id, or "" when the user starts
 *   typing again (clearing the previous selection).
 * - excludeIds: product ids to hide from results (e.g. products already added as
 *   other line items in the same form), so the same product can't be picked twice.
 * - placeholder: input placeholder text.
 *
 * Behavior:
 * - The input's text mirrors the selected product's name when not actively
 *   searching; typing clears the selection and shows up to 6 matching results
 *   (by name or shortCode, case-insensitive) in a dropdown.
 * - On blur, the dropdown closes and the query text resets to the selected
 *   product's name after a short delay (`setTimeout`) so that a click on a result
 *   (which also triggers blur) still registers before the input reverts.
 */
export function ProductPicker({
  products,
  value,
  onChange,
  excludeIds = [],
  placeholder = "Search a product...",
}: {
  products: Product[]
  value: string
  onChange: (productId: string) => void
  excludeIds?: string[]
  placeholder?: string
}) {
  const selected = products.find((p) => p.id === value) ?? null
  const [query, setQuery] = useState(selected?.name ?? "")
  const [focused, setFocused] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || selected?.name.toLowerCase() === q) return []
    return products
      .filter((p) => p.id === value || !excludeIds.includes(p.id))
      .filter((p) => p.name.toLowerCase().includes(q) || p.shortCode?.toLowerCase().includes(q))
      .slice(0, 6)
  }, [products, query, excludeIds, value, selected])

  const showDropdown = focused && results.length > 0

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (value) onChange("")
        }}
        onFocus={() => setFocused(true)}
        onBlur={() =>
          setTimeout(() => {
            setFocused(false)
            setQuery(selected?.name ?? "")
          }, 150)
        }
      />
      {showDropdown && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border/60 bg-popover/95 shadow-xl backdrop-blur-2xl dark:bg-popover/80">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(p.id)
                setQuery(p.name)
                setFocused(false)
              }}
              className="flex w-full items-center justify-between gap-2 border-b border-border/40 px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <span className="truncate">{p.name}</span>
              {p.shortCode && (
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {p.shortCode}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
