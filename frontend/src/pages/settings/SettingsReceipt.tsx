import { SettingsSectionHeader } from "@/pages/settings/SettingsSectionHeader"
import { ReceiptSettingsCard } from "@/components/settings/ReceiptSettingsCard"

/** Settings > Receipt appearance — wraps the self-contained `ReceiptSettingsCard`. */
export default function SettingsReceipt() {
  return (
    <div className="mx-auto max-w-2xl">
      <SettingsSectionHeader title="Receipt appearance" description="Customize what prints on your receipts" />
      <ReceiptSettingsCard />
    </div>
  )
}
