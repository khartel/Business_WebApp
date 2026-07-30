import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

interface SettingsSectionHeaderProps {
  title: string
  description?: string
}

/**
 * Shared back-navigation header for individual Settings sub-pages (Profile,
 * Two-factor authentication, Receipt appearance, Appearance) — a back
 * button to the Settings hub (`/settings`) plus the section's title and
 * description. Translates `title`/`description` itself, same convention as
 * `PageHeader`/`EmptyState`, so callers just pass plain English text.
 */
export function SettingsSectionHeader({ title, description }: SettingsSectionHeaderProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="mb-6 flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/settings")}
        aria-label={t("Back to Settings")}
      >
        <ArrowLeft className="size-4" />
      </Button>
      <div>
        <h1 className="font-heading text-xl font-semibold">{t(title)}</h1>
        {description && <p className="text-sm text-muted-foreground">{t(description)}</p>}
      </div>
    </div>
  )
}
