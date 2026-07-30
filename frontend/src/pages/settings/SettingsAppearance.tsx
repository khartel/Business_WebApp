import { useTranslation } from "react-i18next"
import { SettingsSectionHeader } from "@/pages/settings/SettingsSectionHeader"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { Card, CardContent } from "@/components/ui/card"

/** Settings > Appearance — theme (light/dark/system) and display language. */
export default function SettingsAppearance() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-2xl">
      <SettingsSectionHeader title="Appearance" description="Theme and display language" />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{t("Choose light, dark, or match your system.")}</p>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{t("Choose the app's display language.")}</p>
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
