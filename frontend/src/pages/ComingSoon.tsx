import { Construction } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <EmptyState
        icon={<Construction className="size-6" />}
        title="Coming soon"
        description="This screen is being built in the next phase of the project."
      />
    </div>
  )
}
