import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Receipt } from "lucide-react"
import { toast } from "sonner"
import * as businessService from "@/services/business.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { ApiError } from "@/lib/api-client"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const receiptSchema = z.object({
  receiptTitle: z.string().trim().min(1, "Receipt title is required").max(40),
  receiptFooterNote: z.string().trim().max(200),
  receiptShowSignature: z.boolean(),
})

type ReceiptValues = z.infer<typeof receiptSchema>

/**
 * Settings card for customizing what appears on printed/PDF receipts:
 * receipt title, footer note, and whether to show a signature line. Reads
 * the current values from the active business and saves via
 * `businessService.updateBusiness`, then refetches the current user (which
 * carries business data) so the rest of the app picks up the change.
 * Renders an `EmptyState` instead of the form if there's no active business
 * to edit.
 */
export function ReceiptSettingsCard() {
  const { activeBusinessId, refetchMe } = useAuth()
  const activeBusiness = useActiveBusiness()
  const [serverError, setServerError] = useState<string | null>(null)
  const { t } = useTranslation()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ReceiptValues>({
    resolver: zodResolver(receiptSchema),
    // `defaultValues` seeds the form before `activeBusiness` has loaded (avoids
    // an undefined/empty flash), while `values` keeps the form in sync with the
    // server data once it arrives — react-hook-form treats `values` as a live
    // external source that resets the form whenever it changes (e.g. after
    // `refetchMe()` below), which `defaultValues` alone would not do since
    // defaultValues is only applied once, on mount.
    defaultValues: {
      receiptTitle: "RECEIPT",
      receiptFooterNote: "Thank you for your business!",
      receiptShowSignature: true,
    },
    values: {
      receiptTitle: activeBusiness?.receiptTitle ?? "RECEIPT",
      receiptFooterNote: activeBusiness?.receiptFooterNote ?? "Thank you for your business!",
      receiptShowSignature: activeBusiness?.receiptShowSignature ?? true,
    },
  })

  const onSubmit = async (values: ReceiptValues) => {
    if (!activeBusinessId) return
    setServerError(null)
    try {
      await businessService.updateBusiness(activeBusinessId, values)
      await refetchMe()
      toast.success(t("Receipt appearance updated"))
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : t("Could not update receipt appearance"))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("Receipt appearance")}</CardTitle>
      </CardHeader>
      <CardContent>
        {!activeBusinessId ? (
          <EmptyState
            icon={<Receipt className="size-6" />}
            title="No business selected"
            description="Select or create a business to customize its receipt."
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="receipt-title">{t("Receipt title")}</Label>
              <Input id="receipt-title" {...register("receiptTitle")} />
              {errors.receiptTitle && (
                <p className="text-xs text-destructive">{t(errors.receiptTitle.message ?? "")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="receipt-footer">{t("Footer note")}</Label>
              <Input id="receipt-footer" {...register("receiptFooterNote")} />
              {errors.receiptFooterNote && (
                <p className="text-xs text-destructive">{t(errors.receiptFooterNote.message ?? "")}</p>
              )}
            </div>
            <Controller
              control={control}
              name="receiptShowSignature"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  {t("Show signature line on printed receipts")}
                </label>
              )}
            />

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t("Save changes")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
