import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import * as authService from "@/services/auth.service"
import type { TwoFactorSetup } from "@/services/auth.service"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Settings card for enabling/disabling TOTP-based two-factor authentication.
 * Renders one of three mutually-exclusive states, chosen by local flags
 * (checked in this priority order):
 *   1. `setup` is non-null — a setup-in-progress view showing the QR code /
 *      manual secret from `authService.setupTwoFactor()` and a 6-digit code
 *      field to confirm via `authService.verifyTwoFactorSetup`.
 *   2. `showDisable` is true (and `setup` is null) — a disable-in-progress
 *      view asking for the current password to confirm via
 *      `authService.disableTwoFactor`.
 *   3. Otherwise — the default view, showing an Enabled/Disabled badge
 *      (from `user.twoFactorEnabled`) and a button that either starts setup
 *      or opens the disable confirmation, depending on current status.
 * `loading`/`error` are shared across all three flows and reset whenever a
 * flow is entered/cancelled.
 */
export function TwoFactorCard() {
  const { user, refetchMe } = useAuth()
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null) // non-null while the QR/verify step is shown
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [showDisable, setShowDisable] = useState(false) // true while the disable-password step is shown
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const enabled = !!user?.twoFactorEnabled

  // Kicks off 2FA setup: asks the backend for a new QR code/secret and
  // switches the card into the "setup in progress" state.
  const startSetup = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await authService.setupTwoFactor()
      setSetup(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("Could not start 2FA setup"))
    } finally {
      setLoading(false)
    }
  }

  // Abandons an in-progress setup and returns to the default view.
  const cancelSetup = () => {
    setSetup(null)
    setCode("")
    setError(null)
  }

  // Verifies the entered 6-digit code against the pending setup; on success,
  // refetches the user (so `enabled` flips true) and returns to the default view.
  const confirmSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.verifyTwoFactorSetup(code)
      await refetchMe()
      toast.success(t("Two-factor authentication enabled"))
      setSetup(null)
      setCode("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("Invalid code"))
    } finally {
      setLoading(false)
    }
  }

  // Disables 2FA after re-confirming the user's password; on success,
  // refetches the user and returns to the default view.
  const confirmDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.disableTwoFactor(password)
      await refetchMe()
      toast.success(t("Two-factor authentication disabled"))
      setShowDisable(false)
      setPassword("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("Could not disable 2FA"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("Two-factor authentication")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {setup ? (
          <form onSubmit={confirmSetup} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("Scan this QR code with Google Authenticator (or any TOTP app), then enter the 6-digit code it shows to confirm.")}
            </p>
            <div className="flex flex-col items-center gap-4 text-center">
              <img
                src={setup.qrCodeDataUrl}
                alt={t("2FA QR code")}
                className="size-40 rounded-lg border border-border"
              />
              <div className="w-full max-w-xs space-y-1.5">
                <Label>{t("Can't scan it? Enter this code manually")}</Label>
                <Input value={setup.secret} readOnly className="text-center font-mono" />
              </div>
              <div className="w-full max-w-xs space-y-1.5">
                <Label htmlFor="tfa-code">{t("Authentication code")}</Label>
                <Input
                  id="tfa-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t("6-digit code")}
                  className="text-center"
                />
              </div>
            </div>

            {error && <p className="text-center text-sm text-destructive">{error}</p>}

            <div className="flex justify-center gap-2">
              <Button type="submit" disabled={loading || code.length !== 6}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {t("Verify and enable")}
              </Button>
              <Button type="button" variant="outline" onClick={cancelSetup}>
                {t("Cancel")}
              </Button>
            </div>
          </form>
        ) : showDisable ? (
          <form onSubmit={confirmDisable} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("Enter your current password to disable two-factor authentication.")}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="tfa-disable-password">{t("Current password")}</Label>
              <Input
                id="tfa-disable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={loading || !password}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {t("Disable 2FA")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDisable(false)
                  setPassword("")
                  setError(null)
                }}
              >
                {t("Cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {t("Require a code from an authenticator app when signing in.")}
              </p>
              <Badge variant={enabled ? "secondary" : "outline"} className="gap-1">
                <ShieldCheck className="size-3" />
                {enabled ? t("Enabled") : t("Disabled")}
              </Badge>
            </div>
            {enabled ? (
              <Button variant="outline" onClick={() => setShowDisable(true)}>
                {t("Disable")}
              </Button>
            ) : (
              <Button onClick={startSetup} disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {t("Enable 2FA")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
