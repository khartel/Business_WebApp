import { SettingsSectionHeader } from "@/pages/settings/SettingsSectionHeader"
import { StockAlertSettingsCard } from "@/components/settings/StockAlertSettingsCard"

/** Settings > Stock alerts — wraps the self-contained `StockAlertSettingsCard`. */
export default function SettingsStockAlerts() {
  return (
    <div className="mx-auto max-w-2xl">
      <SettingsSectionHeader
        title="Stock alerts"
        description="Set when you're notified that a product is running low"
      />
      <StockAlertSettingsCard />
    </div>
  )
}
