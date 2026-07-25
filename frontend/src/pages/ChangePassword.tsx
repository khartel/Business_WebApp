import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { KeyRound, Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import * as authService from "@/services/auth.service"
import { ApiError } from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth/AuthShell"
import { AuthField } from "@/components/auth/AuthField"

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export default function ChangePassword() {
  const { user, refetchMe } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const onSubmit = async (values: ChangePasswordValues) => {
    setServerError(null)
    try {
      await authService.changePassword(values)
      await refetchMe()
      toast.success("Password updated successfully")
      navigate("/", { replace: true })
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Could not update password")
    }
  }

  return (
    <AuthShell
      title={user?.mustChangePassword ? "Set a new password" : "Change password"}
      description={
        user?.mustChangePassword
          ? "You're using a temporary password. Choose a new one to continue."
          : "Update the password for your account"
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          icon={KeyRound}
          label="Current password"
          type="password"
          placeholder="Current password"
          autoComplete="current-password"
          autoFocus
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        <AuthField
          icon={Lock}
          label="New password"
          type="password"
          placeholder="New password"
          autoComplete="new-password"
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
          Update password
        </Button>
      </form>
    </AuthShell>
  )
}
