import { Construction } from "lucide-react"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/EmptyState"

/**
 * ComingSoon page — generic placeholder screen used for routes that haven't
 * been built yet. Renders the given `title` as a page heading plus an
 * `EmptyState` telling the user the screen is still under construction.
 * No data fetching or interactions.
 */
export default function ComingSoon({ title }: { title: string }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">{t(title)}</h1>
      <EmptyState
        icon={<Construction className="size-6" />}
        title="Coming soon"
        description="This screen is being built in the next phase of the project."
      />
    </div>
  )
}
