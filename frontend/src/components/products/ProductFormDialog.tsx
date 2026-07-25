import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import * as productService from "@/services/product.service"
import type { Product } from "@/services/product.service"
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

const schema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  unit: z.string().trim().min(1, "Unit is required (e.g. pcs, kg, box)"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  description: z.string().trim().optional(),
})

type FormValues = z.input<typeof schema>
type ParsedValues = z.output<typeof schema>

export function ProductFormDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false)
  const { activeBusinessId } = useAuth()
  const queryClient = useQueryClient()
  const isEdit = !!product

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ParsedValues>({
    resolver: zodResolver(schema),
    values: {
      name: product?.name ?? "",
      unit: product?.unit ?? "",
      price: product?.price ?? 0,
      description: product?.description ?? "",
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["products", activeBusinessId] })
    queryClient.invalidateQueries({ queryKey: ["business", activeBusinessId] })
  }

  const mutation = useMutation({
    mutationFn: (values: ParsedValues) =>
      isEdit
        ? productService.updateProduct(activeBusinessId!, product.id, values)
        : productService.createProduct(activeBusinessId!, values),
    onSuccess: () => {
      invalidate()
      toast.success(isEdit ? "Product updated" : "Product created")
      setOpen(false)
      if (!isEdit) reset()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong")
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="icon-sm" aria-label="Edit product">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            New product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Create a product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Update ${product.name}'s details.` : "Add a new product to this business's catalog."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Name</Label>
            <Input id="prod-name" autoFocus {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-unit">Unit</Label>
              <Input id="prod-unit" placeholder="pcs, kg, box..." {...register("unit")} />
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-price">Price</Label>
              <Input id="prod-price" type="number" step="0.01" min="0" {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-description">Description (optional)</Label>
            <Textarea id="prod-description" rows={3} {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
