import { SettingsSectionHeader } from "@/pages/settings/SettingsSectionHeader"
import { TwoFactorCard } from "@/components/settings/TwoFactorCard"

/** Settings > Two-factor authentication — wraps the self-contained `TwoFactorCard`. */
export default function SettingsTwoFactor() {
  return (
    <div className="mx-auto max-w-2xl">
      <SettingsSectionHeader
        title="Two-factor authentication"
        description="Require a code from an authenticator app when signing in."
      />
      <TwoFactorCard />
    </div>
  )
}
