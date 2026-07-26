import { useState } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, PackagePlus, Plus, Trash2 } from "lucide-react"
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
import { ProductPicker } from "@/components/products/ProductPicker"
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

const schema = z
  .object({
    warehouseId: z.string().min(1, "Select a warehouse"),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, "Select a product"),
          quantity: z.coerce.number().positive("Quantity must be greater than 0"),
        })
      )
      .min(1, "Add at least one product"),
    notes: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      const ids = data.items.map((i) => i.productId).filter(Boolean)
      return new Set(ids).size === ids.length
    },
    { message: "Each product can only be added once", path: ["items"] }
  )

type FormValues = z.input<typeof schema>
type ParsedValues = z.output<typeof schema>

const emptyValues: FormValues = { warehouseId: "", items: [{ productId: "", quantity: 0 }], notes: "" }

export function ReceiveStockDialog() {
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
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ParsedValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })
  const watchedItems = watch("items")

  const mutation = useMutation({
    mutationFn: (values: ParsedValues) => stockService.receiveStock(activeBusinessId!, values),
    onSuccess: (_, values) => {
      queryClient.invalidateQueries({ queryKey: ["products", activeBusinessId] })
      queryClient.invalidateQueries({ queryKey: ["warehouses", activeBusinessId] })
      queryClient.invalidateQueries({ queryKey: ["stock-movements", activeBusinessId] })
      queryClient.invalidateQueries({ queryKey: ["stock", activeBusinessId] })
      toast.success(
        values.items.length === 1 ? "Stock added" : `Stock added for ${values.items.length} products`
      )
      setOpen(false)
      reset(emptyValues)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not add stock")
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset(emptyValues)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <PackagePlus className="size-4" />
          Add stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add stock</DialogTitle>
          <DialogDescription>
            Receive incoming stock into a warehouse — add one or more products at once.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="receive-warehouse">Warehouse</Label>
            <Controller
              control={control}
              name="warehouseId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="receive-warehouse" className="w-full">
                    <SelectValue placeholder="Select a warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehousesQuery.data?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} {w.isPrimary && "(Primary)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.warehouseId && <p className="text-xs text-destructive">{errors.warehouseId.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Products</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <Controller
                    control={control}
                    name={`items.${index}.productId`}
                    render={({ field: pickerField }) => (
                      <ProductPicker
                        products={productsQuery.data ?? []}
                        value={pickerField.value}
                        onChange={pickerField.onChange}
                        excludeIds={(watchedItems ?? [])
                          .map((item, i) => (i === index ? "" : item?.productId))
                          .filter((id): id is string => !!id)}
                      />
                    )}
                  />
                  {errors.items?.[index]?.productId && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.items[index]?.productId?.message}
                    </p>
                  )}
                </div>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Qty"
                  className="w-24"
                  {...register(`items.${index}.quantity`)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remove product"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            {errors.items?.root?.message && (
              <p className="text-xs text-destructive">{errors.items.root.message}</p>
            )}

            <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", quantity: 0 })}>
              <Plus className="size-3.5" />
              Add another product
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receive-notes">Notes (optional)</Label>
            <Textarea
              id="receive-notes"
              rows={2}
              placeholder="e.g. supplier, delivery reference"
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Add stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
