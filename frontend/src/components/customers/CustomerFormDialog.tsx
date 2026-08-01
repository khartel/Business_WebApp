import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import * as customerService from "@/services/customer.service"
import type { Customer } from "@/services/customer.service"
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

// Validation for the customer form; phone is optional.
const schema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  phone: z.string().trim().optional(),
})

type FormValues = z.input<typeof schema>
type ParsedValues = z.output<typeof schema>

/**
 * Dialog for creating or editing a customer record. Dual-purpose based on whether
 * a `customer` is passed in:
 * - No `customer`: renders a "New customer" button trigger and creates a new customer.
 * - `customer` provided: renders a pencil icon-button trigger (isEdit = true) and
 *   updates that customer; the form is pre-filled via RHF's `values` option.
 *
 * On success, invalidates the customers list for the active business.
 */
export function CustomerFormDialog({ customer }: { customer?: Customer }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { activeBusinessId } = useAuth()
  const queryClient = useQueryClient()
  const isEdit = !!customer

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ParsedValues>({
    resolver: zodResolver(schema),
    values: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["customers", activeBusinessId] })
  }

  const mutation = useMutation({
    mutationFn: (values: ParsedValues) =>
      isEdit
        ? customerService.updateCustomer(activeBusinessId!, customer.id, values)
        : customerService.createCustomer(activeBusinessId!, values),
    onSuccess: () => {
      invalidate()
      toast.success(isEdit ? t("Customer updated") : t("Customer added"))
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
          <Button variant="outline" size="icon-sm" aria-label={t("Edit customer")}>
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            {t("New customer")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("Edit customer") : t("Add a customer")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("Update {{name}}'s details.", { name: customer.name })
              : t("Pre-register a customer so they're ready to select at the register.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cust-name">{t("Name")}</Label>
            <Input id="cust-name" autoFocus {...register("name")} />
            {errors.name?.message && <p className="text-xs text-destructive">{t(errors.name.message)}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-phone">{t("Phone (optional)")}</Label>
            <Input id="cust-phone" {...register("phone")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t("Save changes") : t("Add customer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
