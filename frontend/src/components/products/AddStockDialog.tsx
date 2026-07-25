import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, PackagePlus } from "lucide-react"
import { toast } from "sonner"
import * as productService from "@/services/product.service"
import * as warehouseService from "@/services/warehouse.service"
import type { Product } from "@/services/product.service"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/lib/api-client"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  warehouseId: z.string().min(1, "Select a warehouse"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  lowStockThreshold: z.coerce.number().min(0).optional(),
})

type FormValues = z.input<typeof schema>
type ParsedValues = z.output<typeof schema>

export function AddStockDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false)
  const { activeBusinessId } = useAuth()
  const queryClient = useQueryClient()

  const warehousesQuery = useQuery({
    queryKey: ["warehouses", activeBusinessId],
    queryFn: () => warehouseService.getWarehouses(activeBusinessId!),
    enabled: open && !!activeBusinessId,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ParsedValues>({
    resolver: zodResolver(schema),
    defaultValues: { warehouseId: "", quantity: 0, lowStockThreshold: undefined },
  })

  const mutation = useMutation({
    mutationFn: (values: ParsedValues) => productService.addStock(activeBusinessId!, product.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", activeBusinessId] })
      queryClient.invalidateQueries({ queryKey: ["warehouses", activeBusinessId] })
      toast.success(`Stock added to ${product.name}`)
      setOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not add stock")
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="Add stock">
          <PackagePlus className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add stock</DialogTitle>
          <DialogDescription>Add incoming stock of {product.name} to a warehouse.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="stock-warehouse">Warehouse</Label>
            <Select
              value={watch("warehouseId")}
              onValueChange={(value) => setValue("warehouseId", value, { shouldValidate: true })}
            >
              <SelectTrigger id="stock-warehouse" className="w-full">
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
            {errors.warehouseId && <p className="text-xs text-destructive">{errors.warehouseId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stock-qty">Quantity ({product.unit})</Label>
              <Input id="stock-qty" type="number" step="any" min="0" {...register("quantity")} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock-threshold">Low stock alert at</Label>
              <Input id="stock-threshold" type="number" step="any" min="0" placeholder="10" {...register("lowStockThreshold")} />
            </div>
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
