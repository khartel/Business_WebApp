import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import * as customerService from "@/services/customer.service"
import type { Customer } from "@/services/customer.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { countryNameToIso } from "@/lib/countries"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/phone-input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Validation for the customer form; phone and address are both required so
// every saved customer is actually reachable/locatable.
const schema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  phone: z.string().refine(isValidPhoneNumber, "Enter a valid phone number"),
  address: z.string().trim().min(1, "Address is required"),
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
 * Also supports being driven externally (e.g. from the register's Credit
 * customer picker, so a cashier can add someone on the spot without leaving
 * the sale): pass `open`/`onOpenChange` to control it from outside instead
 * of its own built-in trigger, `initialName` to pre-fill the name field, and
 * `onCreated` to be notified with the new customer. All three are optional
 * and default to the original self-contained behavior when omitted.
 *
 * On success, invalidates the customers list for the active business.
 */
export function CustomerFormDialog({
  customer,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  initialName,
  onCreated,
}: {
  customer?: Customer
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialName?: string
  onCreated?: (customer: Customer) => void
}) {
  const { t } = useTranslation()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen
  const { activeBusinessId } = useAuth()
  const activeBusiness = useActiveBusiness()
  const queryClient = useQueryClient()
  const isEdit = !!customer

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ParsedValues>({
    resolver: zodResolver(schema),
    values: {
      name: customer?.name ?? initialName ?? "",
      phone: customer?.phone ?? "",
      address: customer?.address ?? "",
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
    onSuccess: (result) => {
      invalidate()
      toast.success(isEdit ? t("Customer updated") : t("Customer added"))
      setOpen(false)
      if (!isEdit) {
        reset()
        onCreated?.(result)
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : t("Something went wrong"))
    },
  })

  // When driven externally with a fresh `initialName` (e.g. reopened from
  // the register with a different typed name), make sure the form actually
  // reflects it rather than keeping a stale value from a previous open.
  useEffect(() => {
    if (!isEdit && initialName !== undefined) {
      reset({ name: initialName, phone: "", address: "" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialName])

  const content = (
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
          <Label htmlFor="cust-phone">{t("Phone")}</Label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                id="cust-phone"
                value={field.value}
                onChange={field.onChange}
                defaultCountry={countryNameToIso(activeBusiness?.country)}
                aria-invalid={!!errors.phone}
              />
            )}
          />
          {errors.phone?.message && <p className="text-xs text-destructive">{t(errors.phone.message)}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cust-address">{t("Address")}</Label>
          <Input id="cust-address" {...register("address")} />
          {errors.address?.message && <p className="text-xs text-destructive">{t(errors.address.message)}</p>}
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? t("Save changes") : t("Add customer")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {content}
      </Dialog>
    )
  }

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
      {content}
    </Dialog>
  )
}
