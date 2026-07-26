import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import * as customerService from "@/services/customer.service"
import { Input } from "@/components/ui/input"

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
