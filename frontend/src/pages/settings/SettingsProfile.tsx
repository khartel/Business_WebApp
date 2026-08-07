import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import * as authService from "@/services/auth.service"
import { useAuth } from "@/context/AuthContext"
import { useActiveBusiness } from "@/hooks/useActiveBusiness"
import { countryNameToIso } from "@/lib/countries"
import { ApiError } from "@/lib/api-client"
import { SettingsSectionHeader } from "@/pages/settings/SettingsSectionHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/phone-input"

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().refine(isValidPhoneNumber, "Enter a valid phone number"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
})

type ProfileValues = z.infer<typeof profileSchema>

/**
 * Settings > Profile — edit full name / phone / email via a react-hook-form
 * + zod form (`profileSchema`); submits through `authService.updateProfile`
 * then `refetchMe()` to refresh the cached user. Username and role are
 * shown read-only.
 */
export default function SettingsProfile() {
  const { t } = useTranslation()
  const { user, refetchMe } = useAuth()
  const activeBusiness = useActiveBusiness()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.fullName ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
    },
  })

  const onSubmit = async (values: ProfileValues) => {
    setServerError(null)
    try {
      await authService.updateProfile(values)
      await refetchMe()
      toast.success(t("Profile updated"))
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : t("Could not update profile"))
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsSectionHeader title="Profile" description="Your name, phone number, and email" />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="settings-fullname">{t("Full name")}</Label>
                <Input id="settings-fullname" {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-destructive">{t(errors.fullName.message ?? "")}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-username">{t("Username")}</Label>
                <Input id="settings-username" value={user.username} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-phone">{t("Phone number")}</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id="settings-phone"
                      value={field.value}
                      onChange={field.onChange}
                      defaultCountry={countryNameToIso(activeBusiness?.country)}
                      aria-invalid={!!errors.phone}
                    />
                  )}
                />
                {errors.phone && <p className="text-xs text-destructive">{t(errors.phone.message ?? "")}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-email">{t("Email")}</Label>
                <Input id="settings-email" type="email" placeholder={t("Optional")} {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{t(errors.email.message ?? "")}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("Role")}</span>
              <Badge variant="secondary">{user.role}</Badge>
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t("Save changes")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
