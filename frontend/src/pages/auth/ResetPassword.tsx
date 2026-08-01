import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import * as authService from "@/services/auth.service"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth/AuthShell"
import { AuthField } from "@/components/auth/AuthField"

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

/**
 * Reset-password page — reached via the link emailed by ForgotPassword.tsx
 * (`/reset-password?token=...`). The token itself is the proof of identity,
 * so unlike ChangePassword.tsx this form has no "current password" field.
 * A missing token (someone navigating here directly) renders a simple
 * "invalid link" state instead of a form that could never succeed.
 */
export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) return
    setServerError(null)
    try {
      await authService.resetPassword(token, values.newPassword)
      toast.success(t("Password reset successfully. Please log in with your new password."))
      navigate("/login", { replace: true })
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : t("Could not reset password"))
    }
  }

  if (!token) {
    return (
      <AuthShell
        key="invalid"
        title="This link isn't valid"
        description="The reset link is missing or malformed"
        footer={
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            {t("Request a new link")}
          </Link>
        }
      >
        <p className="text-center text-sm text-muted-foreground">
          {t("Double-check the link from your email, or request a new one.")}
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell key="form" title="Set a new password" description="Choose a new password for your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          icon={Lock}
          label="New password"
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          autoFocus
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <AuthField
          icon={Lock}
          label="Confirm new password"
          type="password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button
          type="submit"
          className="w-full rounded-full bg-gradient-to-r from-primary to-success text-primary-foreground hover:opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("Reset password")}
        </Button>
      </form>
    </AuthShell>
  )
}
