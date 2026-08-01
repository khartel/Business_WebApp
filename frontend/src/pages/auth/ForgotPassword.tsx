import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { Mail, Loader2, MailCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import * as authService from "@/services/auth.service"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth/AuthShell"
import { AuthField } from "@/components/auth/AuthField"

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

/**
 * Forgot-password page — a single email field, submitted via
 * `authService.forgotPassword`. Always swaps to the same "check your email"
 * confirmation view on success, regardless of whether the email actually
 * matched an account: the backend deliberately never reveals that
 * distinction (avoids leaking which emails are registered), so this page
 * can't branch on it either. The confirmation message also covers the case
 * of a team member with no email on file, pointing them back to the
 * Team-page-mediated reset instead.
 *
 * Mirrors Login.tsx's two-state-view pattern (distinct `key` per step, so
 * React remounts cleanly on the state transition).
 */
export default function ForgotPassword() {
  const { t } = useTranslation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: ForgotPasswordValues) => {
    setServerError(null)
    try {
      await authService.forgotPassword(values.email)
      setSubmittedEmail(values.email)
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : t("Something went wrong"))
    }
  }

  if (submittedEmail) {
    return (
      <AuthShell
        key="sent"
        title="Check your email"
        description={t("If an account exists for {{email}}, we've sent password-reset instructions.", { email: submittedEmail })}
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("Back to sign in")}
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
            <MailCheck className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("No email on file for your account? Ask your business owner or admin to reset your password from the Team page instead.")}
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      key="request"
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to reset it"
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          {t("Back to sign in")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          icon={Mail}
          label="Email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
          {...register("email")}
        />

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button
          type="submit"
          className="w-full rounded-full bg-gradient-to-r from-primary to-success text-primary-foreground hover:opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("Send reset link")}
        </Button>
      </form>
    </AuthShell>
  )
}
