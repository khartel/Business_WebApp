import { useEffect, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import * as customerService from "@/services/customer.service"
import type { Customer } from "@/services/customer.service"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
 * Dialog for merging a duplicate customer record into another one — fixes
 * the "same person typed two different ways" case (e.g. "Chidi" vs. "Chidi
 * Okafor") without losing either one's sales/credit history. `customer` is
 * the duplicate being merged away; picking a target moves all of
 * `customer`'s transactions onto the target and soft-deletes `customer`.
 *
 * The target picker reuses the same debounced-search pattern as the POS
 * register's customer name field (see `CustomerNameField.tsx`), rather than
 * a full combobox component, since neither exists elsewhere in this app
 * yet and this is the second place that would need one.
 */
export function MergeCustomerDialog({
  businessId,
  customer,
  trigger,
}: {
  businessId: string
  customer: Customer
  trigger: ReactNode
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [target, setTarget] = useState<Customer | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 200)
    return () => clearTimeout(timer)
  }, [search])

  const searchQuery = useQuery({
    queryKey: ["customers-search", businessId, debounced],
    queryFn: () => customerService.getCustomers(businessId, { search: debounced, limit: 6 }),
    enabled: open && debounced.trim().length > 0 && !target,
  })

  const results = (searchQuery.data ?? []).filter((c) => c.id !== customer.id)

  const reset = () => {
    setSearch("")
    setDebounced("")
    setTarget(null)
  }

  const mutation = useMutation({
    mutationFn: () => customerService.mergeCustomer(businessId, customer.id, target!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
      toast.success(t("{{name}} merged into {{into}}", { name: customer.name, into: target!.name }))
      setOpen(false)
      reset()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : t("Could not merge customers")),
  })

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
          <DialogTitle>{t("Merge duplicate customer")}</DialogTitle>
          <DialogDescription>
            {t(
              "All of {{name}}'s past sales will move to the customer you pick below, then {{name}} will be removed from your directory.",
              { name: customer.name }
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {target ? (
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/50 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{target.name}</p>
                {target.phone && <p className="text-xs text-muted-foreground">{target.phone}</p>}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setTarget(null)}>
                {t("Change")}
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={t("Search for the customer to merge into...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {debounced.trim().length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border/60 bg-popover/95 shadow-xl backdrop-blur-2xl dark:bg-popover/80">
                  {results.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">{t("No matches")}</p>
                  ) : (
                    results.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setTarget(c)}
                        className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button disabled={!target || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("Merge")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
