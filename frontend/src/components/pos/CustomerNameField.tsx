import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import * as customerService from "@/services/customer.service"
import { Input } from "@/components/ui/input"

/**
 * Free-text customer name input used in the POS sale flow, with a debounced
 * autocomplete dropdown of matching existing customers (by name/phone) so
 * cashiers can reuse an existing customer record instead of typing a fresh
 * name each time. The input value itself is always controlled by the parent
 * (`value`/`onChange`) — selecting a suggestion just calls `onChange` with
 * that customer's name, it does not track a separate "selected customer" id.
 */
export function CustomerNameField({
  businessId,
  value,
  onChange,
  placeholder,
  required,
  error,
}: {
  businessId: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
  error?: string
}) {
  const [debounced, setDebounced] = useState(value)
  const [focused, setFocused] = useState(false)

  // Debounce the search query by 200ms so we don't fire a request on every
  // keystroke while the user is typing.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 200)
    return () => clearTimeout(timer)
  }, [value])

  const query = useQuery({
    queryKey: ["customers-search", businessId, debounced],
    queryFn: () => customerService.getCustomers(businessId, { search: debounced, limit: 5 }),
    enabled: debounced.trim().length > 0,
  })

  const results = query.data ?? []
  // Dropdown only shows while the input is focused and there's a non-empty
  // debounced query with results — `onBlur` below delays hiding it slightly
  // so a click on a suggestion (onMouseDown preventDefault) can register
  // before blur closes the dropdown.
  const showDropdown = focused && debounced.trim().length > 0 && results.length > 0

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        aria-invalid={!!error}
        aria-required={required}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border/60 bg-popover/95 shadow-xl backdrop-blur-2xl dark:bg-popover/80">
          {results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(customer.name)
                setFocused(false)
              }}
              className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <span className="font-medium">{customer.name}</span>
              {customer.phone && <span className="text-xs text-muted-foreground">{customer.phone}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
