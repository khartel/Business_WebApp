import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, PackageX, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import * as businessService from "@/services/business.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { PRESET_UNITS } from "@/lib/units"
import { ApiError } from "@/lib/api-client"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const stockAlertSchema = z.object({
  defaultLowStockThreshold: z.coerce.number().positive("Must be greater than 0"),
  rules: z.array(
    z.object({
      unit: z.string().trim().min(1, "Select a unit"),
      threshold: z.coerce.number().positive("Must be greater than 0"),
    })
  ),
})

type FormValues = z.input<typeof stockAlertSchema>
type ParsedValues = z.output<typeof stockAlertSchema>

/**
 * Settings card for the business's low-stock alert rule: a flat fallback
 * threshold, plus optional per-unit overrides (e.g. "pcs" below 50,
 * "carton" below 3). Applies to any warehouse-stock line that hasn't been
 * given its own explicit threshold when stock was received — this is a
 * live rule, not a one-time default, so editing it here retroactively
 * affects every such line's low-stock flag, not just future restocks.
 */
export function StockAlertSettingsCard() {
  const { activeBusinessId, refetchMe } = useAuth()
  const activeBusiness = useActiveBusiness()
  const [serverError, setServerError] = useState<string | null>(null)
  const { t } = useTranslation()

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues, unknown, ParsedValues>({
    resolver: zodResolver(stockAlertSchema),
    defaultValues: {
      defaultLowStockThreshold: 10,
      rules: [],
    },
    values: {
      defaultLowStockThreshold: activeBusiness?.defaultLowStockThreshold ?? 10,
      rules: activeBusiness
        ? Object.entries(activeBusiness.lowStockThresholdsByUnit).map(([unit, threshold]) => ({
            unit,
            threshold,
          }))
        : [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "rules" })
  const watchedRules = watch("rules")

  const onSubmit = async (values: ParsedValues) => {
    if (!activeBusinessId) return
    setServerError(null)
    try {
      await businessService.updateBusiness(activeBusinessId, {
        defaultLowStockThreshold: values.defaultLowStockThreshold,
        lowStockThresholdsByUnit: Object.fromEntries(values.rules.map((r) => [r.unit, r.threshold])),
      })
      await refetchMe()
      toast.success(t("Stock alert settings updated"))
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : t("Could not update stock alert settings"))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("Stock alerts")}</CardTitle>
      </CardHeader>
      <CardContent>
        {!activeBusinessId ? (
          <EmptyState
            icon={<PackageX className="size-6" />}
            title="No business selected"
            description="Select or create a business to configure its stock alerts."
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="default-threshold">{t("Default low-stock threshold")}</Label>
              <Input
                id="default-threshold"
                type="number"
                min="0"
                step="any"
                {...register("defaultLowStockThreshold")}
              />
              <p className="text-xs text-muted-foreground">
                {t("Used for any product whose unit isn't covered by a rule below.")}
              </p>
              {errors.defaultLowStockThreshold?.message && (
                <p className="text-xs text-destructive">{t(errors.defaultLowStockThreshold.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("Per-unit rules (optional)")}</Label>
              <p className="text-xs text-muted-foreground">
                {t('e.g. notify when "pcs" stock drops below 50.')}
              </p>
              {fields.map((field, index) => {
                const usedUnits = new Set(
                  (watchedRules ?? [])
                    .map((r, i) => (i === index ? "" : (r?.unit ?? "")))
                    .filter(Boolean)
                )
                const rowOptions = PRESET_UNITS.filter((u) => !usedUnits.has(u))
                const unitError = errors.rules?.[index]?.unit?.message
                const thresholdError = errors.rules?.[index]?.threshold?.message
                return (
                  <div key={field.id} className="flex items-start gap-2">
                    <Controller
                      control={control}
                      name={`rules.${index}.unit`}
                      render={({ field: unitField }) => (
                        <Select value={unitField.value} onValueChange={unitField.onChange}>
                          <SelectTrigger className="w-32 shrink-0">
                            <SelectValue placeholder={t("Unit")} />
                          </SelectTrigger>
                          <SelectContent>
                            {rowOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder={t("Threshold")}
                        {...register(`rules.${index}.threshold`)}
                      />
                      {(unitError || thresholdError) && (
                        <p className="mt-1 text-xs text-destructive">{t(unitError ?? thresholdError ?? "")}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={t("Remove rule")}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fields.length >= PRESET_UNITS.length}
                onClick={() => {
                  const usedUnits = new Set((watchedRules ?? []).map((r) => r.unit))
                  const nextUnit = PRESET_UNITS.find((u) => !usedUnits.has(u)) ?? ""
                  append({ unit: nextUnit, threshold: 10 })
                }}
              >
                <Plus className="size-3.5" />
                {t("Add rule")}
              </Button>
            </div>

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
