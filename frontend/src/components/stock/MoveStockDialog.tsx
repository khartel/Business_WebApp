import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import * as stockService from "@/services/stock.service"
import * as warehouseService from "@/services/warehouse.service"
import * as productService from "@/services/product.service"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Validation schema for the move-stock form. `quantity` uses z.coerce since
// the underlying <Input type="number"> yields a string; the `.refine` adds a
// cross-field check that source and destination warehouses differ (attached
// to the `toWarehouseId` field so its error renders next to that select).
const schema = z
  .object({
    productId: z.string().min(1, "Select a product"),
    fromWarehouseId: z.string().min(1, "Select a source warehouse"),
    toWarehouseId: z.string().min(1, "Select a destination warehouse"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
    message: "Source and destination must be different",
    path: ["toWarehouseId"],
  })

// FormValues is the raw (pre-coercion) shape react-hook-form works with;
// ParsedValues is what comes out after zod resolves/coerces it (e.g.
// `quantity` as a number) — used as the mutation's input type.
type FormValues = z.input<typeof schema>
type ParsedValues = z.output<typeof schema>

/**
 * Dialog + trigger button for transferring a quantity of a product between
 * two warehouses. Warehouse and product lists are fetched lazily (`enabled:
 * open && ...`) only once the dialog is opened, to avoid unnecessary
 * requests while it's closed. On successful submit, invalidates the
 * stock-movements, products, and warehouses queries so affected views
 * refresh, then closes the dialog and resets the form.
 */
export function MoveStockDialog() {
  const [open, setOpen] = useState(false)
  const { activeBusinessId } = useAuth()
  const queryClient = useQueryClient()

  const warehousesQuery = useQuery({
    queryKey: ["warehouses", activeBusinessId],
    queryFn: () => warehouseService.getWarehouses(activeBusinessId!),
    enabled: open && !!activeBusinessId,
  })
  const productsQuery = useQuery({
    queryKey: ["products", activeBusinessId],
    queryFn: () => productService.getProducts(activeBusinessId!),
    enabled: open && !!activeBusinessId,
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ParsedValues>({
    resolver: zodResolver(schema),
    defaultValues: { productId: "", fromWarehouseId: "", toWarehouseId: "", quantity: 0, notes: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: ParsedValues) => stockService.moveStock(activeBusinessId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements", activeBusinessId] })
      queryClient.invalidateQueries({ queryKey: ["products", activeBusinessId] })
      queryClient.invalidateQueries({ queryKey: ["warehouses", activeBusinessId] })
      toast.success("Stock moved")
      setOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not move stock")
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ArrowLeftRight className="size-4" />
          Move stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move stock</DialogTitle>
          <DialogDescription>Transfer product quantity between warehouses.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="move-product">Product</Label>
            <Controller
              control={control}
              name="productId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="move-product" className="w-full">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsQuery.data?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="move-from">From</Label>
              <Controller
                control={control}
                name="fromWarehouseId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="move-from" className="w-full">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehousesQuery.data?.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="move-to">To</Label>
              <Controller
                control={control}
                name="toWarehouseId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="move-to" className="w-full">
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehousesQuery.data?.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          {errors.toWarehouseId && <p className="text-xs text-destructive">{errors.toWarehouseId.message}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="move-qty">Quantity</Label>
            <Input id="move-qty" type="number" step="any" min="0" {...register("quantity")} />
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="move-notes">Notes (optional)</Label>
            <Textarea id="move-notes" rows={2} {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Move stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
