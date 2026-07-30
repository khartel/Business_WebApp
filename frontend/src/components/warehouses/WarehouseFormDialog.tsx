import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import * as warehouseService from "@/services/warehouse.service"
import type { Warehouse } from "@/services/warehouse.service"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
  name: z.string().trim().min(1, "Warehouse name is required"),
  location: z.string().trim().optional(),
  isPrimary: z.boolean(),
})

type FormValues = z.infer<typeof schema>

/**
 * Dialog for creating or editing a warehouse. Dual-purpose based on whether a
 * `warehouse` is passed in:
 * - No `warehouse`: "New warehouse" button trigger; also lets the user check
 *   "Set as primary warehouse" (only offered on create — the isPrimary field is
 *   omitted from the update call, so a warehouse's primary status can't be changed
 *   from this dialog once created).
 * - `warehouse` provided: pencil icon-button trigger (isEdit = true), updates only
 *   name/location.
 *
 * On success, invalidates the warehouses list and the active business query (whose
 * summary may include warehouse counts).
 */
export function WarehouseFormDialog({ warehouse }: { warehouse?: Warehouse }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { activeBusinessId } = useAuth()
  const queryClient = useQueryClient()
  const isEdit = !!warehouse

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: warehouse?.name ?? "",
      location: warehouse?.location ?? "",
      isPrimary: warehouse?.isPrimary ?? false,
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["warehouses", activeBusinessId] })
    queryClient.invalidateQueries({ queryKey: ["business", activeBusinessId] })
  }

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? warehouseService.updateWarehouse(activeBusinessId!, warehouse.id, {
            name: values.name,
            location: values.location,
          })
        : warehouseService.createWarehouse(activeBusinessId!, values),
    onSuccess: () => {
      invalidate()
      toast.success(isEdit ? t("Warehouse updated") : t("Warehouse created"))
      setOpen(false)
      if (!isEdit) reset()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : t("Something went wrong"))
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="icon-sm" aria-label={t("Edit warehouse")}>
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            {t("New warehouse")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("Edit warehouse") : t("Create a warehouse")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("Update {{name}}'s details.", { name: warehouse.name })
              : t("Add a new stock location for this business.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wh-name">{t("Name")}</Label>
            <Input id="wh-name" autoFocus {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{t(errors.name.message ?? "")}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wh-location">{t("Location (optional)")}</Label>
            <Input id="wh-location" {...register("location")} />
          </div>
          {!isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watch("isPrimary")}
                onCheckedChange={(checked) => setValue("isPrimary", checked === true)}
              />
              {t("Set as primary warehouse")}
            </label>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t("Save changes") : t("Create warehouse")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
