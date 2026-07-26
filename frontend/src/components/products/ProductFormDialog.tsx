import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const UNIT_OPTIONS = [
  "pcs",
  "dozen",
  "pack",
  "box",
  "carton",
  "bag",
  "kg",
  "g",
  "litre",
  "millilitre",
  "pair",
  "roll",
  "bundle",
  "set",
]
const OTHER_UNIT = "__other__"

const schema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  unit: z.string().trim().min(1, "Unit is required (e.g. pcs, kg, box)"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  description: z.string().trim().optional(),
  shortCode: z.string().trim().max(20, "Keep it to 20 characters or fewer").optional(),
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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ParsedValues>({
    resolver: zodResolver(schema),
    values: {
      name: product?.name ?? "",
      unit: product?.unit ?? "",
      price: product?.price ?? 0,
      description: product?.description ?? "",
      shortCode: product?.shortCode ?? "",
    },
  })

  const unitValue = watch("unit") ?? ""
  const [customUnitMode, setCustomUnitMode] = useState(
    () => unitValue !== "" && !UNIT_OPTIONS.includes(unitValue)
  )

  useEffect(() => {
    const initial = product?.unit ?? ""
    setCustomUnitMode(initial !== "" && !UNIT_OPTIONS.includes(initial))
  }, [product?.unit])

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
              <Select
                value={customUnitMode ? OTHER_UNIT : unitValue}
                onValueChange={(value) => {
                  if (value === OTHER_UNIT) {
                    setCustomUnitMode(true)
                    setValue("unit", "", { shouldValidate: false })
                  } else {
                    setCustomUnitMode(false)
                    setValue("unit", value, { shouldValidate: true })
                  }
                }}
              >
                <SelectTrigger id="prod-unit" className="w-full">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER_UNIT}>Other (custom)</SelectItem>
                </SelectContent>
              </Select>
              {customUnitMode && (
                <Input
                  autoFocus
                  placeholder="Type a custom unit"
                  value={unitValue}
                  onChange={(e) => setValue("unit", e.target.value, { shouldValidate: true })}
                />
              )}
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-price">Price</Label>
              <Input id="prod-price" type="number" step="0.01" min="0" {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-shortcode">Short code (optional)</Label>
            <Input id="prod-shortcode" placeholder="e.g. fn14" {...register("shortCode")} />
            <p className="text-xs text-muted-foreground">A quick nickname to find this product faster at the register.</p>
            {errors.shortCode && <p className="text-xs text-destructive">{errors.shortCode.message}</p>}
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
